"use client";

import { calculateCheckout, marketCatalog, searchMarketCatalog } from "@altora/market-pos";
import { type RefObject, useMemo, useRef, useState } from "react";

type Screen = "home" | "cashier" | "products";

type CartLine = (typeof marketCatalog)[number] & { quantity: number };
type NavigationItem = { id: string; label: string; icon: string };
type NavigationGroup = { group: string; items: readonly NavigationItem[] };

const navigation: readonly NavigationGroup[] = [
  { group: "Beranda", items: [{ id: "home", label: "Beranda", icon: "⌂" }] },
  {
    group: "Penjualan",
    items: [
      { id: "cashier", label: "Kasir", icon: "▣" },
      { id: "transactions", label: "Transaksi", icon: "◫" },
      { id: "promo", label: "Promo", icon: "✦" },
      { id: "member", label: "Member", icon: "◉" },
    ],
  },
  {
    group: "Produk & stok",
    items: [
      { id: "products", label: "Produk & Stok", icon: "□" },
      { id: "receipt", label: "Barang Masuk", icon: "↓" },
      { id: "adjustment", label: "Penyesuaian Stok", icon: "↺" },
    ],
  },
  { group: "Mitra", items: [{ id: "supplier", label: "Supplier", icon: "♧" }] },
  { group: "Analisis", items: [{ id: "report", label: "Laporan", icon: "◔" }] },
  {
    group: "Sistem",
    items: [
      { id: "team", label: "Tim", icon: "♙" },
      { id: "settings", label: "Pengaturan", icon: "⚙" },
    ],
  },
] as const;

const categories = ["Semua", ...new Set(marketCatalog.map((product) => product.category))];
const mobileNavigation: readonly NavigationItem[] = [
  navigation[0]!.items[0]!,
  navigation[1]!.items[0]!,
  navigation[2]!.items[0]!,
  navigation[1]!.items[3]!,
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function Icon({ children }: { children: string }) {
  return <span aria-hidden="true" className="market-icon">{children}</span>;
}

export function MarketWorkspace() {
  const [screen, setScreen] = useState<Screen>("home");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [notice, setNotice] = useState("");
  const pageTitleRef = useRef<HTMLHeadingElement>(null);

  const filteredProducts = useMemo(() => searchMarketCatalog(query, category), [query, category]);
  const checkout = useMemo(
    () => calculateCheckout({ items: cart.map((line) => ({ unitPrice: line.price, quantity: line.quantity })) }),
    [cart],
  );
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  function selectScreen(next: string) {
    if (next === "home" || next === "cashier" || next === "products") {
      setScreen(next);
      setNotice(`Membuka ${next === "home" ? "Beranda" : next === "cashier" ? "Kasir" : "Produk & Stok"}. Fokus dipindahkan ke judul halaman.`);
      window.setTimeout(() => pageTitleRef.current?.focus(), 0);
      return;
    }
    setNotice(`${navigation.flatMap((group) => group.items).find((item) => item.id === next)?.label ?? "Halaman ini"} akan dimigrasikan setelah alur utama Market tervalidasi.`);
  }

  function addProduct(product: (typeof marketCatalog)[number]) {
    setCart((previous) => {
      const matchingLine = previous.find((line) => line.id === product.id);
      if (!matchingLine) return [...previous, { ...product, quantity: 1 }];
      if (matchingLine.quantity >= product.stock) {
        setNotice(`${product.name} sudah mencapai stok tersedia: ${product.stock} ${product.unit.toLocaleLowerCase("id-ID")}.`);
        return previous;
      }
      return previous.map((line) => line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
    });
    setNotice(`${product.name} ditambahkan ke keranjang.`);
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((previous) => previous.flatMap((line) => {
      if (line.id !== productId) return [line];
      if (quantity <= 0) {
        setNotice(`${line.name} dihapus dari keranjang.`);
        return [];
      }
      const adjustedQuantity = Math.min(quantity, line.stock);
      setNotice(`${line.name}: jumlah ${adjustedQuantity}. Total keranjang diperbarui.`);
      return [{ ...line, quantity: adjustedQuantity }];
    }));
  }

  function clearCart() {
    setCart([]);
    setNotice("Keranjang dikosongkan.");
  }

  function completeCheckout() {
    if (!cart.length) {
      setNotice("Tambahkan produk sebelum menyelesaikan transaksi.");
      return;
    }
    setCart([]);
    setNotice(`Transaksi demo sebesar ${formatRupiah(checkout.total)} selesai. Data belum tersimpan karena integrasi database belum dimigrasikan.`);
  }

  return (
    <div className="market-app-shell">
      <a className="market-skip-link" href="#market-main">Lewati navigasi</a>
      <aside className="market-sidebar" aria-label="Navigasi Altora Market">
        <button type="button" className="market-store-card" onClick={() => selectScreen("home")}>
          <span className="market-store-name">Toko Altora Demo</span>
          <span>Toko · Outlet aktif</span>
        </button>
        <nav aria-label="Menu Market">
          {navigation.map((group) => (
            <section className="market-nav-group" key={group.group} aria-labelledby={`market-nav-${group.group}`}>
              <h2 id={`market-nav-${group.group}`}>{group.group}</h2>
              {group.items.map((item) => {
                const isActive = screen === item.id;
                return (
                  <button
                    aria-current={isActive ? "page" : undefined}
                    className={isActive ? "is-active" : undefined}
                    key={item.id}
                    onClick={() => selectScreen(item.id)}
                    type="button"
                  >
                    <Icon>{item.icon}</Icon>{item.label}
                  </button>
                );
              })}
            </section>
          ))}
        </nav>
        <div className="market-user-card"><strong>Owner Demo</strong><span>Pemilik</span></div>
      </aside>

      <div className="market-page">
        <header className="market-topbar">
          <div><span>Toko Altora Demo</span><strong>Toko · Outlet aktif</strong></div>
          <div className="market-topbar-actions"><span className="market-sync">● Sinkron</span><button type="button" aria-label="Notifikasi">♧</button></div>
        </header>
        <main id="market-main" className="market-main" tabIndex={-1}>
          <p aria-live="polite" aria-atomic="true" className="market-live-region">{notice}</p>
          {screen === "home" && <HomeScreen headingRef={pageTitleRef} onOpenCashier={() => selectScreen("cashier")} onOpenProducts={() => selectScreen("products")} />}
          {screen === "cashier" && <CashierScreen cart={cart} cartCount={cartCount} category={category} checkout={checkout} filteredProducts={filteredProducts} headingRef={pageTitleRef} onAddProduct={addProduct} onCheckout={completeCheckout} onCategoryChange={setCategory} onClearCart={clearCart} onQueryChange={setQuery} onUpdateQuantity={updateQuantity} query={query} />}
          {screen === "products" && <ProductsScreen headingRef={pageTitleRef} onOpenCashier={() => selectScreen("cashier")} />}
        </main>
        <nav className="market-mobile-nav" aria-label="Navigasi cepat">
          {mobileNavigation.map((item) => (
            <button aria-current={screen === item.id ? "page" : undefined} aria-label={`Buka ${item.label}`} className={screen === item.id ? "is-active" : undefined} key={item.id} onClick={() => selectScreen(item.id)} type="button"><Icon>{item.icon}</Icon>{item.label.split(" ")[0]}</button>
          ))}
          <button onClick={() => setNotice("Navigasi lengkap tersedia di desktop. Item lain dimigrasikan dalam iterasi berikutnya.")} type="button"><Icon>•••</Icon>Lainnya</button>
        </nav>
      </div>
    </div>
  );
}

function HomeScreen({ headingRef, onOpenCashier, onOpenProducts }: { headingRef: RefObject<HTMLHeadingElement | null>; onOpenCashier: () => void; onOpenProducts: () => void }) {
  const stats = [
    ["Omzet hari ini", "Rp1.248.000", "Kemarin Rp1.042.000", "is-primary"],
    ["Transaksi", "38", "Item terjual hari ini", ""],
    ["Rata-rata belanja", "Rp32.842", "Berdasarkan transaksi", ""],
    ["Shift aktif", "1", "Kasir sedang berjalan", ""],
  ];
  return <div className="market-stack">
    <div className="market-page-title"><div><p>Beranda toko</p><h1 ref={headingRef} tabIndex={-1}>Operasional hari ini</h1><span>Pantau penjualan, shift, dan stok yang butuh perhatian.</span></div><div className="market-primary-actions"><button onClick={onOpenCashier} type="button">Buka Kasir</button><button onClick={onOpenProducts} type="button">Tambah Produk</button></div></div>
    <section className="market-stat-grid" aria-label="Ringkasan hari ini">{stats.map(([label, value, detail, className]) => <article className={`market-stat-card ${className}`} key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section>
    <div className="market-content-grid">
      <section className="market-panel"><div className="market-panel-heading"><div><h2>Perlu ditindak</h2><p>Prioritas sebelum toko tutup.</p></div><button type="button">Lihat semua</button></div><div className="market-alert-list"><article><span className="market-alert-dot is-warning" aria-hidden="true" /><div><strong>Stok Roti Cokelat menipis</strong><p>Tersisa 9 pcs di outlet aktif.</p></div><button type="button">Buka</button></article><article><span className="market-alert-dot" aria-hidden="true" /><div><strong>Kasir shift pagi aktif</strong><p>Kas tunai terakhir diperbarui pukul 10.24.</p></div><button type="button">Buka</button></article></div></section>
      <section className="market-panel"><div className="market-panel-heading"><div><h2>Produk terlaris</h2><p>Ringkasan transaksi hari ini.</p></div><button type="button">Buka laporan</button></div><ol className="market-top-products"><li><b>1</b><span><strong>Air Mineral 600 ml</strong><small>26 item terjual</small></span><em>Rp130.000</em></li><li><b>2</b><span><strong>Mie Instan Goreng</strong><small>18 item terjual</small></span><em>Rp63.000</em></li><li><b>3</b><span><strong>Kopi Susu Botol</strong><small>12 item terjual</small></span><em>Rp216.000</em></li></ol></section>
    </div>
  </div>;
}

function CashierScreen({ cart, cartCount, category, checkout, filteredProducts, headingRef, onAddProduct, onCategoryChange, onCheckout, onClearCart, onQueryChange, onUpdateQuantity, query }: { cart: CartLine[]; cartCount: number; category: string; checkout: ReturnType<typeof calculateCheckout>; filteredProducts: readonly (typeof marketCatalog)[number][]; headingRef: RefObject<HTMLHeadingElement | null>; onAddProduct: (product: (typeof marketCatalog)[number]) => void; onCategoryChange: (category: string) => void; onCheckout: () => void; onClearCart: () => void; onQueryChange: (value: string) => void; onUpdateQuantity: (productId: string, quantity: number) => void; query: string }) {
  return <div className="market-cashier">
    <div className="market-page-title is-cashier"><div><p>Penjualan</p><h1 ref={headingRef} tabIndex={-1}>Kasir</h1><span>Toko Altora Demo · Shift pagi</span></div><div className="market-primary-actions"><button type="button">Gesek tunai</button><button type="button">Riwayat</button><button type="button">Tutup shift</button></div></div>
    <div className="market-pos-layout">
      <section className="market-pos-catalog" aria-labelledby="catalog-title"><div className="market-search-wrap"><label htmlFor="market-product-search">Cari produk atau scan barcode</label><input id="market-product-search" onChange={(event) => onQueryChange(event.target.value)} placeholder="Nama produk atau barcode" value={query} /></div><div className="market-category-list" aria-label="Kategori produk">{categories.map((item) => <button aria-pressed={category === item} className={category === item ? "is-active" : undefined} key={item} onClick={() => onCategoryChange(item)} type="button">{item}</button>)}</div><h2 id="catalog-title">Katalog produk</h2><div className="market-product-grid">{filteredProducts.map((product) => <article key={product.id}><span className="market-product-mark" aria-hidden="true">{product.category[0]}</span><div><h3>{product.name}</h3><p>{product.unit} · Stok {product.stock}</p><strong>{formatRupiah(product.price)}</strong></div><button onClick={() => onAddProduct(product)} type="button" aria-label={`Tambah ${product.name}`}>Tambah</button></article>)}</div>{filteredProducts.length === 0 && <div className="market-empty-state"><strong>Produk tidak ditemukan</strong><p>Periksa barcode atau coba kata kunci lain.</p></div>}</section>
      <aside className="market-cart" aria-label="Keranjang transaksi"><div className="market-cart-heading"><div><h2>Pesanan</h2><span>{cartCount} item</span></div><button disabled={!cart.length} onClick={onClearCart} type="button">Kosongkan</button></div>{cart.length ? <ul>{cart.map((line) => <li key={line.id}><div><strong>{line.name}</strong><span>{formatRupiah(line.price)}</span></div><div className="market-quantity"><button aria-label={`Kurangi ${line.name}`} onClick={() => onUpdateQuantity(line.id, line.quantity - 1)} type="button">−</button><span>{line.quantity}</span><button aria-label={`Tambah ${line.name}`} onClick={() => onUpdateQuantity(line.id, line.quantity + 1)} type="button">+</button></div></li>)}</ul> : <div className="market-empty-cart"><span aria-hidden="true">▣</span><strong>Keranjang masih kosong</strong><p>Pilih produk dari katalog untuk memulai transaksi.</p></div>}<div className="market-cart-total"><span>Total</span><strong>{formatRupiah(checkout.total)}</strong></div><button className="market-checkout-button" disabled={!cart.length} onClick={onCheckout} type="button">Bayar {cart.length ? formatRupiah(checkout.total) : ""}</button></aside>
    </div>
  </div>;
}

function ProductsScreen({ headingRef, onOpenCashier }: { headingRef: RefObject<HTMLHeadingElement | null>; onOpenCashier: () => void }) {
  return <div className="market-stack"><div className="market-page-title"><div><p>Produk & stok</p><h1 ref={headingRef} tabIndex={-1}>Katalog retail</h1><span>Barcode, satuan, harga, dan stok outlet aktif.</span></div><div className="market-primary-actions"><button onClick={onOpenCashier} type="button">Buka Kasir</button><button type="button">Tambah Produk</button></div></div><section className="market-panel market-product-table"><div className="market-panel-heading"><div><h2>Produk aktif</h2><p>{marketCatalog.length} produk pada data demonstrasi lokal.</p></div><button type="button">Impor produk</button></div><div className="market-table-scroll"><table><caption className="sr-only">Daftar produk retail demonstrasi</caption><thead><tr><th scope="col">Produk</th><th scope="col">Barcode</th><th scope="col">Satuan</th><th scope="col">Stok</th><th scope="col">Harga</th></tr></thead><tbody>{marketCatalog.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><span>{product.category}</span></td><td>{product.barcode}</td><td>{product.unit}</td><td>{product.stock}</td><td>{formatRupiah(product.price)}</td></tr>)}</tbody></table></div></section></div>;
}
