const GenderToggle = ({ label, isChecked, onChange }) => {
    return (
        <label className="toggle">
            <span>{label}</span>
            <input
                type="radio"
                name="gender"
                checked={isChecked}
                onChange={onChange}
            />
            <span className="toggle-item"></span>
        </label>
    );
};

export default GenderToggle;