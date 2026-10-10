import { Star, Gift, Check, Sparkles } from "lucide-react";

export default function DigitalLoyaltyCard({
  customerName = "Client",
  ordersCount = 0,
  threshold = 5,
  rewardTitle = "Une boisson offerte",
  compact = false,
  className = "",
}) {
  const currentStamps = ordersCount % threshold;
  const rewardsUnlocked = Math.floor(ordersCount / threshold);
  const ordersUntilNext = threshold - currentStamps;
  const isRewardReady = ordersCount > 0 && currentStamps === 0;

  // Création des 5 tampons (de 1 à threshold)
  const stamps = Array.from({ length: threshold }, (_, idx) => {
    const stampNum = idx + 1;
    const isCompleted = currentStamps >= stampNum || (isRewardReady && stampNum === threshold);
    const isLast = stampNum === threshold;
    return { stampNum, isCompleted, isLast };
  });

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {stamps.map(({ stampNum, isCompleted, isLast }) => (
            <span
              key={stampNum}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                isCompleted
                  ? isLast
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-emerald-600 text-white"
                  : "border border-zinc-200 bg-zinc-100 text-zinc-400"
              }`}
              title={isLast ? `Palier 5 : ${rewardTitle}` : `Tampon ${stampNum}`}
            >
              {isCompleted ? isLast ? "🎁" : <Check size={11} strokeWidth={3} /> : stampNum}
            </span>
          ))}
        </div>
        <span className="text-xs font-semibold text-zinc-700">
          {currentStamps}/{threshold}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-900 via-teal-900 to-zinc-900 p-5 text-white shadow-lg ${className}`}
    >
      {/* Halo décoratif d'arrière-plan */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl" />

      {/* En-tête de la carte */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
            <Sparkles size={15} />
          </span>
          <div>
            <h4 className="text-xs font-extrabold tracking-wider uppercase text-emerald-300">
              Carte de Fidélité Digitale
            </h4>
            <p className="text-xs text-zinc-300 font-medium">{customerName}</p>
          </div>
        </div>

        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 backdrop-blur-xs">
          {currentStamps} / {threshold} tampons
        </span>
      </div>

      {/* Les tampons virtuels */}
      <div className="relative z-10 my-4 flex items-center justify-between gap-2 px-1">
        {stamps.map(({ stampNum, isCompleted, isLast }) => (
          <div key={stampNum} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border transition-all ${
                isCompleted
                  ? isLast
                    ? "border-amber-400 bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30 animate-pulse"
                    : "border-emerald-400 bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : isLast
                    ? "border-dashed border-amber-400/50 bg-white/5 text-amber-300"
                    : "border-white/15 bg-white/5 text-zinc-400"
              }`}
            >
              {isCompleted ? (
                isLast ? (
                  <Gift size={20} className="text-white" />
                ) : (
                  <Check size={18} strokeWidth={3} />
                )
              ) : isLast ? (
                <Gift size={18} className="opacity-70" />
              ) : (
                <span className="text-xs font-bold opacity-60">{stampNum}</span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">
              {isLast ? "Cadeau" : `#${stampNum}`}
            </span>
          </div>
        ))}
      </div>

      {/* Pied de carte avec statut & récompense */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs border border-white/5">
        <p className="text-zinc-300">
          {ordersUntilNext === 0 || isRewardReady ? (
            <span className="font-bold text-amber-300 flex items-center gap-1">
              🎉 Félicitations ! Votre récompense est prête : {rewardTitle} !
            </span>
          ) : (
            <span>
              Plus que <strong className="text-emerald-300">{ordersUntilNext} commande{ordersUntilNext > 1 ? "s" : ""}</strong> avant votre : <strong className="text-white">{rewardTitle}</strong>
            </span>
          )}
        </p>

        {rewardsUnlocked > 0 && (
          <span className="text-[11px] text-zinc-400 font-medium">
            🏆 {rewardsUnlocked} cadeau{rewardsUnlocked > 1 ? "x" : ""} débloqué{rewardsUnlocked > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
