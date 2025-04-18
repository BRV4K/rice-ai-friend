const Slider = ({ value, onChange }) => {
    return (
        <div className="slider-container">
            <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="slider"
                style={{ '--value': value }} // Передаем значение как CSS-переменную
            />
        </div>
    );
};

export default Slider;