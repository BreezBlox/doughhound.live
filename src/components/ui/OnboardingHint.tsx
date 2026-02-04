import { useEffect } from "react";

const OnboardingHint = ({ onShow }: { onShow: () => void }) => {
  useEffect(() => {
    // Only show onboarding if the user hasn't seen it
    if (!localStorage.getItem("ddf_onboarding_seen")) {
      setTimeout(() => {
        onShow();
        localStorage.setItem("ddf_onboarding_seen", "1");
      }, 600);
    }
  }, [onShow]);
  return null;
};

export default OnboardingHint;
