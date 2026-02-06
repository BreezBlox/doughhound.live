import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

// --- MICRO-COMPONENTS ---

const GhostTyper = ({ text, delay = 0, speed = 50 }: { text: string; delay?: number; speed?: number }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    setDisplayed("");

    timeout = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        setDisplayed(text.substring(0, i + 1));
        i++;
        if (i > text.length) clearInterval(interval);
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, delay, speed]);

  return <span>{displayed}<span className="animate-pulse border-r-2 border-ops-accent ml-0.5 h-4 inline-block align-middle"></span></span>;
};

// --- SLIDE CONTENT ---

const onboardingSteps = [
  // SLIDE 1: Welcome
  {
    title: "Welcome to Dough Hound",
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
  // SLIDE 2: Creating Sheet + Copying URL
  {
    title: "Step 1: Create Your Data Vault",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          Your data is <span className="text-ops-accent font-bold">100% yours</span>. We store everything in a Google Sheet you own.
        </p>
        <ol className="space-y-2 text-sm text-ops-dim font-mono">
          <li className="flex items-start gap-2">
            <span className="text-ops-success font-bold w-4">1.</span>
            <span>Go to <span className="text-ops-accent underline">sheets.new</span> in your browser.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ops-success font-bold w-4">2.</span>
            <span>A new blank Google Sheet will open.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ops-success font-bold w-4">3.</span>
            <span>Copy the full URL from your browser's address bar.</span>
          </li>
        </ol>
        <div className="bg-ops-bg border border-ops-border p-2 rounded text-[10px] font-mono text-ops-dim break-all">
          https://docs.google.com/spreadsheets/d/<span className="text-ops-accent">YOUR_SHEET_ID</span>/edit
        </div>
      </div>
    ),
  },
  // SLIDE 3: Pasting URL + Connecting
  {
    title: "Step 2: Connect the Uplink",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          On the <span className="text-ops-accent font-bold">Connect Sheet</span> screen, paste your URL and click <span className="font-bold">CONNECT</span>.
        </p>
        <div className="bg-ops-bg border border-ops-border p-3 rounded text-xs font-mono text-ops-success">
          <span className="text-ops-dim">STATUS:</span> <GhostTyper text="SECURE_UPLINK_ESTABLISHED" delay={500} speed={30} />
        </div>
        <p className="text-xs text-ops-dim">
          Once connected, transactions you add will appear as rows in the <span className="text-ops-accent">'Transactions'</span> tab of your sheet.
        </p>
        <p className="text-xs text-ops-dim italic border-l-2 border-ops-accent pl-2">
          You can access your sheet anytime from Google Drive. Your data never lives on our servers.
        </p>
      </div>
    ),
  },
  // SLIDE 4: Graph Mockup (Forecast)
  {
    title: "The Projection Graph",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          The <span className="text-ops-accent font-bold">Projection Graph</span> shows your forecasted balance over the next 1-3 months.
        </p>
        {/* Simple Mockup of Graph */}
        <div className="bg-ops-bg border border-ops-border rounded p-3 h-28 flex items-end justify-around gap-1">
          <div className="w-3 bg-ops-success/70 rounded-t" style={{ height: '60%' }}></div>
          <div className="w-3 bg-ops-success/70 rounded-t" style={{ height: '80%' }}></div>
          <div className="w-3 bg-ops-danger/70 rounded-t" style={{ height: '30%' }}></div>
          <div className="w-3 bg-ops-danger/70 rounded-t" style={{ height: '15%' }}></div>
          <div className="w-3 bg-ops-success/70 rounded-t" style={{ height: '50%' }}></div>
          <div className="w-3 bg-ops-success/70 rounded-t" style={{ height: '70%' }}></div>
          <div className="w-3 bg-ops-success/70 rounded-t" style={{ height: '90%' }}></div>
        </div>
        <p className="text-xs text-ops-dim text-center">
          <span className="text-ops-success">Green</span> = Safe Zone | <span className="text-ops-danger">Red</span> = Danger Zone
        </p>
      </div>
    ),
  },
  // SLIDE 5: 10-Day Schedule
  {
    title: "Your 10-Day Outlook",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          Below the graph, you'll see a <span className="text-ops-accent font-bold">10-day schedule</span> of upcoming transactions.
        </p>
        {/* Mockup Table */}
        <div className="bg-ops-bg border border-ops-border rounded overflow-hidden font-mono text-[10px]">
          <div className="grid grid-cols-4 bg-ops-panel/50 text-ops-dim uppercase p-2">
            <span>Date</span><span>Net</span><span>Balance</span><span>Event</span>
          </div>
          <div className="grid grid-cols-4 p-2 border-t border-ops-border/30 text-ops-text">
            <span>Feb 10</span><span className="text-ops-danger">-$150</span><span>$1,450</span><span className="truncate">Netflix</span>
          </div>
          <div className="grid grid-cols-4 p-2 border-t border-ops-border/30 text-ops-text">
            <span>Feb 14</span><span className="text-ops-success">+$2,400</span><span>$3,850</span><span className="truncate">Paycheck</span>
          </div>
        </div>
        <p className="text-xs text-ops-dim">
          This helps you see exactly when bills hit and when you get paid.
        </p>
      </div>
    ),
  },
  // SLIDE 6: Adding Transactions
  {
    title: "Adding Transactions",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          Use the <span className="text-ops-accent font-bold">Add Transaction</span> card on the right side.
        </p>
        <div className="flex gap-4 justify-center">
          {/* Expense Button Mockup */}
          <div className="bg-ops-danger text-white text-xs font-bold py-2 px-4 rounded shadow">
            Expense
          </div>
          {/* Paycheck Button Mockup */}
          <div className="bg-ops-panel border border-ops-border text-white text-xs font-bold py-2 px-4 rounded shadow">
            Paycheck
          </div>
        </div>
        <ul className="space-y-2 text-sm text-ops-dim">
          <li className="flex items-start gap-2">
            <span className="text-ops-danger font-bold">▶</span>
            <span><strong className="text-ops-text">Expense:</strong> Bills, subscriptions, one-time purchases.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ops-success font-bold">▶</span>
            <span><strong className="text-ops-text">Paycheck:</strong> Income, deposits, transfers in.</span>
          </li>
        </ul>
      </div>
    ),
  },
  // SLIDE 7: Frequency & Limit
  {
    title: "Frequency & Limits",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          Set how often a transaction repeats with the <span className="text-ops-accent font-bold">Frequency</span> dropdown.
        </p>
        <div className="bg-ops-bg border border-ops-border rounded p-3 font-mono text-xs space-y-1">
          <div className="text-ops-dim uppercase text-[10px]">Frequency</div>
          <div className="text-ops-text">Weekly | Bi-Weekly | Monthly | Every 4 Weeks</div>
        </div>
        <p className="text-ops-text leading-relaxed">
          Use the <span className="text-ops-accent font-bold">Limit</span> field for installment plans (e.g., AfterPay).
        </p>
        <p className="text-xs text-ops-dim italic border-l-2 border-ops-accent pl-2">
          Example: A $100 purchase split into 4 payments. Set Frequency = "Bi-Weekly" and Limit = "4".
        </p>
      </div>
    ),
  },
  // SLIDE 8: Sidebar Management
  {
    title: "Manage Your Transactions",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          The <span className="text-ops-accent font-bold">left sidebar</span> shows all your saved transactions.
        </p>
        <ul className="space-y-2 text-sm text-ops-dim">
          <li className="flex items-start gap-2">
            <span className="text-ops-accent font-bold">✏️</span>
            <span>Click the <strong className="text-ops-text">pencil icon</strong> to edit an entry.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ops-danger font-bold">🗑️</span>
            <span>Click the <strong className="text-ops-text">trash icon</strong> to delete an entry.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ops-accent font-bold">👁</span>
            <span>Click the <strong className="text-ops-text">eye icon</strong> to hide/show an entry from the graph (for "what-if" scenarios).</span>
          </li>
        </ul>
      </div>
    ),
  },
  // SLIDE 9: Reserve Sync
  {
    title: "Sync Your Reserve",
    content: (
      <div className="space-y-4">
        <p className="text-ops-text leading-relaxed">
          If your actual bank balance is different due to unplanned purchases, click on the <span className="text-ops-accent font-bold">Current Reserve</span> amount in the header.
        </p>
        <div className="bg-ops-bg border border-ops-accent p-3 rounded text-center">
          <div className="text-[10px] text-ops-dim uppercase">Current Reserve</div>
          <div className="text-2xl font-orbitron text-white">$2,847.50 <span className="text-ops-accent text-sm">✏️</span></div>
          <div className="text-[10px] text-ops-accent mt-1 underline cursor-pointer">Sync to Today</div>
        </div>
        <p className="text-xs text-ops-dim">
          This re-anchors your forecast. Do this periodically to keep projections accurate.
        </p>
      </div>
    ),
  },
];


const OnboardingDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const lastStep = step === onboardingSteps.length - 1;

  // Reset to step 0 when dialog opens
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-ops-card border-ops-accent/30 text-ops-text max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-orbitron tracking-wider text-ops-accent text-xl">
            {onboardingSteps[step].title}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-ops-dim uppercase">
            Briefing {step + 1} / {onboardingSteps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 min-h-[180px] flex flex-col justify-start">
          {onboardingSteps[step].content}
        </div>

        <DialogFooter className="flex justify-between items-center mt-4 border-t border-ops-border pt-4">
          <Button variant="ghost" onClick={onClose} className="text-ops-dim hover:text-ops-text font-mono text-xs">SKIP</Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-ops-accent/50 text-ops-accent hover:bg-ops-accent/10 font-mono text-xs"
              >
                BACK
              </Button>
            )}
            {!lastStep ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="bg-ops-accent text-ops-bg hover:bg-ops-light font-bold font-mono text-xs tracking-wider"
              >
                NEXT
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="bg-ops-success text-ops-bg hover:bg-green-400 font-bold font-mono text-xs tracking-wider animate-pulse"
              >
                LET'S GO
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
