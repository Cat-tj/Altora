import { notFound } from "next/navigation";
import { auth } from "../../../../../auth";
import { getMarketShiftSummary } from "../../../../../lib/market-pos";
import { CloseShiftForm } from "../../close-shift-form";

export default async function CloseShiftPage({ params }: { params: Promise<{ shiftId: string }> }) {
  const { shiftId } = await params; const user = (await auth())!.user as { id: string; tenantId: string }; const summary = await getMarketShiftSummary({ tenantId: user.tenantId, userId: user.id, shiftId }); if (!summary) notFound();
  return <CloseShiftForm summary={summary} />;
}
