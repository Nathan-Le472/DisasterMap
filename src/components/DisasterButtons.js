import { Icon } from "@iconify/react";

const DisasterButtons = ({
  name,
  id,
  iconType,
  handleSelectClick,
  iconClass,
}) => {
  return (
    <button className="disaster-button" onClick={handleSelectClick} value={id}>
      {name}
      <span><Icon icon={iconType} className={iconClass} /></span>
    </button>
  );
};

export default DisasterButtons;