import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

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
          <span className="text-ops-dim">STATUS:</span> ENCRYPTED_UPLINK_ESTABLISHED
        </div>
        <p className="text-xs text-ops-dim">
          If you refresh, your data persists. If you edit the sheet directly, the dashboard updates.
        </p>
      </div>
    ),
  },
  {
    title: "Tactical Controls",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text">
          Use the <span className="font-bold text-ops-accent">Quick Add</span> panel to log operations:
        </p>
        <ul className="space-y-2 text-sm text-ops-dim">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span><strong className="text-ops-text">Expenditures</strong> (Bills/Expenses)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span><strong className="text-ops-text">Acquisitions</strong> (Paychecks/Deposit)</span>
          </li>
        </ul>
        <p className="text-xs text-ops-dim italic border-l-2 border-ops-accent pl-2">
          Tip: Set a "Limit" on recurring bills to automatically stop them after X payments (e.g., AfterPay).
        </p>
      </div>
    ),
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
