import { Pizza } from "lucide-react";

export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        {/* Premium Loading Spinner with Pizza Icon */}
        <div className="relative flex items-center justify-center w-16 h-16 bg-white rounded-3xl border border-warm-200/50 shadow-lg shadow-warm-300/30">
          <Pizza className="w-8 h-8 text-primary animate-bounce" />
          <div className="absolute inset-0 border-3 border-primary/20 border-t-primary rounded-3xl animate-spin" />
        </div>
        
        <div>
          <h2 className="text-base font-bold text-warm-900">Baking the menu...</h2>
          <p className="text-xs text-warm-500 mt-1 leading-relaxed">
            Fetching fresh ingredients and delicious options. Just a second!
          </p>
        </div>
      </div>
    </div>
  );
}
