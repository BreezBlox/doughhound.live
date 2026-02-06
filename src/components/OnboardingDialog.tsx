import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

// --- MICRO-COMPONENTS ---

const GhostTyper = ({ text, delay = 0, speed = 50, onComplete }: { text: string; delay?: number; speed?: number, onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout; // Declare interval here

    // Reset displayed text when text prop changes
    setDisplayed("");

    // Initial delay
    timeout = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => { // Assign to declared interval
        setDisplayed(text.substring(0, i + 1));
        i++;
        if (i > text.length) {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval); // Clear interval on cleanup
    };
  }, [text, delay, speed, onComplete]); // Add onComplete to dependencies

  return <span>{displayed}<span className="animate-pulse border-r-2 border-ops-accent ml-0.5 h-4 inline-block align-middle"></span></span>;
};

const SimulationSlide = () => {
  // 0: idle, 1: typing desc, 2: typing amount, 3: completed
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t = setTimeout(() => setPhase(1), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-ops-text mb-4">
        Rapidly log operations with the <span className="text-ops-accent font-bold">Quick Add</span> panel.
      </p>

      {/* Mock Form */}
      <div className="bg-ops-bg border border-ops-dim/30 p-4 rounded font-mono text-xs shadow-lg transform scale-95 border-l-4 border-l-ops-success">
        <div className="flex flex-col gap-3">
          {/* Description Field */}
          <div className="space-y-1">
            <span className="text-ops-dim uppercase text-[10px]">Description</span>
            <div className="bg-black/40 p-2 rounded border border-ops-border text-ops-text h-8 flex items-center">
              {phase >= 1 ? (
                <GhostTyper
                  text="E-CORP PAYCHECK"
                  speed={40}
                  onComplete={() => setTimeout(() => setPhase(2), 500)}
                />
              ) : null}
            </div>
          </div>

          {/* Amount Field */}
          <div className="space-y-1">
            <span className="text-ops-dim uppercase text-[10px]">Amount</span>
            <div className="bg-black/40 p-2 rounded border border-ops-border text-ops-success font-bold h-8 flex items-center">
              {phase >= 2 ? (
                <GhostTyper
                  text="$2,450.00"
                  speed={60}
                  onComplete={() => setTimeout(() => setPhase(3), 500)}
                />
              ) : null}
            </div>
          </div>

          {/* Submit Button */}
          <div className={`mt-1 bg-ops-success text-ops-bg text-center py-1.5 font-bold rounded transition-all duration-300 ${phase === 3 ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
            {phase === 3 ? "ACQUISITION LOGGED" : "PENDING DATA..."}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-ops-dim text-center italic mt-2">
        * Simulating user input...
      </p>
    </div>
  );
};


const onboardingSteps = [
  {
    title: "Welcome to Daily Dough Flow",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          Welcome, Operator. This dashboard gives you <span className="text-ops-accent font-bold">tactical visibility</span> into your financial runway.
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-ops-dim">
            <span className="text-ops-accent mt-1">▶</span>
            <span>Forecast your exact balance 30-90 days out.</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-ops-dim">
            <span className="text-ops-accent mt-1">▶</span>
            <span>Catch negative drift before it happens.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "Google Sheets Sync",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          Your data is yours. We sync directly to your personal Google Sheet in real-time.
        </p>
        <div className="bg-ops-bg border border-ops-border p-3 rounded text-xs font-mono text-ops-success">
          <span className="text-ops-dim">STATUS:</span> <GhostTyper text="ENCRYPTED_UPLINK_ESTABLISHED" delay={500} speed={30} />
        </div>
        <p className="text-xs text-ops-dim">
          If you refresh, your data persists. If you edit the sheet directly, the dashboard updates.
        </p>
      </div>
    ),
  },
  {
    title: "Tactical Controls",
    content: <SimulationSlide />
  },
  {
    title: "Scenario Planning",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text">
          Run simulations by toggling entries on/off.
        </p>
        <ul className="space-y-2 text-sm text-ops-dim">
          <li className="flex items-start gap-2">
            <span className="text-ops-accent font-bold">👁</span>
            <span>Click the eye icon to hide an entry without deleting it.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ops-accent font-bold">⚡</span>
            <span>The graph updates instantly to show your new runway.</span>
          </li>
        </ul>
      </div>
    ),
  }
];

const OnboardingDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const lastStep = step === onboardingSteps.length - 1;

  // Reset phase on step change (simple way is to just remount content which React does by default for array map, 
  // but here we are rendering specific content. The SimulationSlide uses useEffect to reset itself on mount.)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-ops-card border-ops-accent/30 text-ops-text">
        <DialogHeader>
          <DialogTitle className="font-orbitron tracking-wider text-ops-accent text-xl">
            {onboardingSteps[step].title}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-ops-dim uppercase">
            Briefing Phase {step + 1} / {onboardingSteps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 min-h-[160px] flex flex-col justify-center">
          {onboardingSteps[step].content}
        </div>

        <DialogFooter className="flex justify-between items-center mt-4 border-t border-ops-border pt-4">
          <Button variant="ghost" onClick={onClose} className="text-ops-dim hover:text-ops-text font-mono text-xs">DISMISS</Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-ops-accent/50 text-ops-accent hover:bg-ops-accent/10 font-mono text-xs"
              >
                PREV
              </Button>
            )}
            {!lastStep ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="bg-ops-accent text-ops-bg hover:bg-ops-light font-bold font-mono text-xs tracking-wider"
              >
                NEXT_INTEL
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="bg-ops-success text-ops-bg hover:bg-green-400 font-bold font-mono text-xs tracking-wider animate-pulse"
              >
                EXECUTE
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
