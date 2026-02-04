import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";

const onboardingSteps = [
  {
    title: "Welcome to Daily Dough Flow!",
    content: (
      <>
        <p className="mb-2" style={{ color: '#000' }}>Welcome! This app helps you forecast, visualize, and manage your finances with tactical precision.</p>
        <ul className="list-disc ml-5 text-sm" style={{ color: '#000' }}>
          <li style={{ color: '#000' }}>Log bills, paychecks, and purchases with one click</li>
          <li style={{ color: '#000' }}>Track recurring, one-time, and custom-date entries</li>
          <li style={{ color: '#000' }}>Visualize your financial reserve over time</li>
        </ul>
      </>
    ),
  },
  {
    title: "Adding & Editing Entries",
    content: (
      <>
        <p className="mb-2" style={{ color: '#000' }}>Use the forms to add expenditures (bills/purchases) and acquisitions (paychecks):</p>
        <ul className="list-disc ml-5 text-sm" style={{ color: '#000' }}>
          <li style={{ color: '#000' }}>Choose one-time or recurring schedules for any entry</li>
          <li style={{ color: '#000' }}>Set limits or stop dates for recurrences, or pick multiple custom dates</li>
          <li style={{ color: '#000' }}>Edit or delete any entry by clicking the pencil or trash icon</li>
        </ul>
      </>
    ),
  },
  {
    title: "Understanding the Graph & Log",
    content: (
      <>
        <p className="mb-2" style={{ color: '#000' }}>The graph shows your projected reserve over time, based on all visible entries. The log lists every entry and its dates.</p>
        <ul className="list-disc ml-5 text-sm" style={{ color: '#000' }}>
          <li style={{ color: '#000' }}>Red = expenditures, Green = paychecks, Yellow = purchases</li>
          <li style={{ color: '#000' }}>All recurring and custom dates are included</li>
        </ul>
      </>
    ),
  },
  {
    title: "Hide/Show Entries for Scenario Planning",
    content: (
      <>
        <p className="mb-2" style={{ color: '#000' }}>Experiment with different financial routes using the new toggle feature:</p>
        <ul className="list-disc ml-5 text-sm" style={{ color: '#000' }}>
          <li style={{ color: '#000' }}>Click the eye icon next to any entry in the Operations Log to hide or show it</li>
          <li style={{ color: '#000' }}>Hidden entries are dimmed in the log and excluded from the forecast graph and export</li>
          <li style={{ color: '#000' }}>Mix and match visible entries to instantly analyze different financial scenarios</li>
        </ul>
      </>
    ),
  },
  {
    title: "Pro Tips",
    content: (
      <>
        <ul className="list-disc ml-5 text-sm" style={{ color: '#000' }}>
          <li style={{ color: '#000' }}>Add to your phone home screen for a native app feel (PWA!)</li>
          <li style={{ color: '#000' }}>Export or import logs via CSV for backup or bulk editing</li>
        </ul>
      </>
    ),
  },
  {
    title: "You're Ready!",
    content: (
      <>
        <p className="mb-2" style={{ color: '#000' }}>Dive in and start tracking your dough. You can always revisit this guide from the menu.</p>
      </>
    ),
  },
];

const OnboardingDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const lastStep = step === onboardingSteps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{onboardingSteps[step].title}</DialogTitle>
        </DialogHeader>
        <div className="py-2" style={{ color: '#000' }}>{onboardingSteps[step].content}</div>
        <DialogFooter className="flex justify-between mt-4">
          <Button variant="ghost" onClick={onClose}>Skip</Button>
          <div>
            {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
            {!lastStep ? (
              <Button onClick={() => setStep(step + 1)} className="ml-2">Next</Button>
            ) : (
              <Button onClick={onClose} className="ml-2">Finish</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
