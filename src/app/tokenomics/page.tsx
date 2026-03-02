import { ALLOCATIONS, TOTAL_SUPPLY, STAKING_TIERS, REVENUE_SPLIT, SLASH_SPLIT } from "@/lib/tokenomics/config";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TokenomicsPage() {
  const allocations = Object.values(ALLOCATIONS);
  const tiers = Object.values(STAKING_TIERS);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          $VIGIL Tokenomics
        </h1>
        <p className="text-zinc-500 mb-8">
          Total supply: {TOTAL_SUPPLY.toLocaleString()} VIGIL
        </p>

        {/* Allocation table */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Token Allocation
          </h2>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">
                    Allocation
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">
                    %
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">
                    Vesting
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {allocations.map((a) => (
                  <tr key={a.label}>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {a.label}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-700 dark:text-zinc-300">
                      {a.percentage}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-zinc-700 dark:text-zinc-300">
                      {a.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {a.vesting}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Staking tiers */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Staking Tiers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.label}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center"
              >
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {tier.label}
                </p>
                <p className="text-2xl font-mono font-bold text-blue-600 mt-1">
                  {tier.threshold.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 mt-1">$VIGIL required</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  {tier.audits} audits
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue split */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Revenue Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Scan Fee Revenue
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Auditor reward
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {REVENUE_SPLIT.auditorReward}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Bounty vault
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {REVENUE_SPLIT.bountyVault}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Protocol treasury
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {REVENUE_SPLIT.protocol}%
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Slash Distribution
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Challenger
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {SLASH_SPLIT.challenger}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Bounty vault
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {SLASH_SPLIT.bountyVault}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Burned
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {SLASH_SPLIT.burned}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Growth flywheel */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Growth Flywheel
          </h2>
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <div className="flex flex-col items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                More auditors stake
              </p>
              <span>&#8595;</span>
              <p>More skills get verified</p>
              <span>&#8595;</span>
              <p>More agents trust and use Vigil</p>
              <span>&#8595;</span>
              <p>More scan fees generated</p>
              <span>&#8595;</span>
              <p>More auditor rewards</p>
              <span>&#8595;</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                More auditors stake (loop)
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
