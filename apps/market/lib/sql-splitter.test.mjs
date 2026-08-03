import { test } from "node:test";
import assert from "node:assert/strict";
import { splitSql } from "../scripts/sql-splitter.mjs";

test("splits simple statements on semicolons", () => {
  const sql = "CREATE TABLE a (id int); CREATE TABLE b (id int);";
  assert.deepEqual(splitSql(sql), [
    "CREATE TABLE a (id int)",
    "CREATE TABLE b (id int)",
  ]);
});

test("keeps semicolons inside dollar-quoted function body", () => {
  const sql = `
CREATE OR REPLACE FUNCTION bump_stock() RETURNS trigger AS $$
BEGIN
  UPDATE stock SET qty = qty + NEW.qty WHERE id = NEW.id;
  IF NEW.qty < 0 THEN
    RAISE EXCEPTION 'negatif';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TABLE after_fn (id int);`;
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 2);
  assert.match(stmts[0], /^CREATE OR REPLACE FUNCTION bump_stock/);
  assert.match(stmts[0], /UPDATE stock SET qty = qty \+ NEW\.qty WHERE id = NEW\.id;/); // semicolon survived inside body
  assert.equal(stmts[1], "CREATE TABLE after_fn (id int)");
});

test("handles named dollar quotes ($tag$ ... $tag$)", () => {
  const sql = `
CREATE FUNCTION f() RETURNS text AS $body$
  SELECT 'x;y';
$body$ LANGUAGE sql;
SELECT 1;`;
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 2);
  assert.match(stmts[0], /SELECT 'x;y';/);
  assert.equal(stmts[1], "SELECT 1");
});

test("keeps semicolons inside single-quoted strings", () => {
  const sql = "INSERT INTO t (v) VALUES ('a;b'); SELECT 2;";
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 2);
  assert.match(stmts[0], /VALUES \('a;b'\)/);
  assert.equal(stmts[1], "SELECT 2");
});

test("handles escaped single quotes (doubled '')", () => {
  const sql = "INSERT INTO t (v) VALUES ('it''s; tricky'); SELECT 3;";
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 2);
  assert.match(stmts[0], /it''s; tricky/);
  assert.equal(stmts[1], "SELECT 3");
});

test("ignores semicolons in line comments", () => {
  const sql = "-- comment; with semicolon\nCREATE TABLE a (id int);";
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 1);
  assert.match(stmts[0], /CREATE TABLE a \(id int\)/);
});

test("ignores semicolons in block comments", () => {
  const sql = "/* comment; with semicolon */ CREATE TABLE a (id int);";
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 1);
  // leading comment stays attached to the statement — still valid SQL
  assert.match(stmts[0], /CREATE TABLE a \(id int\)/);
});

test("handles trailing text without final semicolon", () => {
  const sql = "CREATE TABLE a (id int); CREATE TABLE b (id int)";
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 2);
  assert.equal(stmts[1], "CREATE TABLE b (id int)");
});

test("returns empty array for empty content", () => {
  assert.deepEqual(splitSql(""), []);
  assert.deepEqual(splitSql("   \n  "), []);
  assert.deepEqual(splitSql("-- only a comment"), []);
});

test("keeps comments attached to their statement", () => {
  const sql = "CREATE TABLE a (id int); -- trailing comment";
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 1);
  assert.equal(stmts[0], "CREATE TABLE a (id int)");
});

test("handles DO blocks with nested semicolons and dollar quotes", () => {
  const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'my_enum') THEN
    CREATE TYPE my_enum AS ENUM ('a', 'b');
  END IF;
END
$$;
CREATE TABLE t (id int);`;
  const stmts = splitSql(sql);
  assert.equal(stmts.length, 2);
  assert.match(stmts[0], /^DO \$\$/);
  assert.match(stmts[0], /CREATE TYPE my_enum/);
  assert.equal(stmts[1], "CREATE TABLE t (id int)");
});
