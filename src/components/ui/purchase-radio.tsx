import React from "react";

interface PurchaseRadioProps {
  checked: boolean;
  onChange: () => void;
}

const PurchaseRadio: React.FC<PurchaseRadioProps> = ({ checked, onChange }) => (
  <label className="flex items-center cursor-pointer">
    <input
      type="radio"
      name="entryType"
      checked={checked}
      onChange={onChange}
      className="appearance-none w-5 h-5 border-2 border-yellow-400 rounded-full relative cursor-pointer checked:border-yellow-400 before:content-[''] before:block before:absolute before:w-3 before:h-3 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-yellow-400 before:scale-0 checked:before:scale-100 before:transition-transform"
    />
    <span className="text-yellow-400 text-xs uppercase ml-1 font-medium">
      Log Purchase
    </span>
  </label>
);

export default PurchaseRadio;
