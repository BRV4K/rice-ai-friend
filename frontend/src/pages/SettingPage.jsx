import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateSettings } from '../store/slices/settingsSlice.js';
import GenderToggle from '../components/GenderToggle.jsx';
import Slider from '../components/Slider.jsx';
import WebApp from '@twa-dev/sdk';

export default function SettingPage() {
    const [gender, setGender] = useState('подруга');
    const [talkativeness, setTalkativeness] = useState(8);
    const [sensitivity, setSensitivity] = useState(3);
    const [enthusiasm, setEnthusiasm] = useState(7);
    const [boldness, setBoldness] = useState(4);
    const [humor, setHumor] = useState(6);
    const [argumentativeness, setArgumentativeness] = useState(2);
    const [interests, setInterests] = useState(['кино', 'музыка', 'искусство']);
    const [isButtonActive, setIsButtonActive] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const userId = WebApp.initDataUnsafe?.user?.id?.toString() || 'default';

    // Загружаем настройки из MongoDB при монтировании
    useEffect(() => {
        console.log('Fetching settings for userId:', userId);
        fetch(`/api/rice/${userId}`)
            .then((res) => {
                console.log('Fetch settings response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log('Settings data:', data);
                if (data && Object.keys(data).length > 0) {
                    setGender(data.gender || 'подруга');
                    setTalkativeness(data.talkativeness || 8);
                    setSensitivity(data.sensitivity || 3);
                    setEnthusiasm(data.enthusiasm || 7);
                    setBoldness(data.boldness || 4);
                    setHumor(data.humor || 6);
                    setArgumentativeness(data.argumentativeness || 2);
                    setInterests(data.interests || ['кино', 'музыка', 'искусство']);
                    dispatch(updateSettings(data));
                }
            })
            .catch((err) => {
                console.error('Error fetching settings:', err);
            });
    }, [dispatch, userId]);

    const handleGenderChange = (selectedGender) => {
        setGender(selectedGender);
    };

    const handleTalkativenessChange = (value) => {
        setTalkativeness(value);
        console.log('Talkativeness:', value);
    };

    const handleSensitivityChange = (value) => {
        setSensitivity(value);
        console.log('Sensitivity:', value);
    };

    const handleEnthusiasmChange = (value) => {
        setEnthusiasm(value);
        console.log('Enthusiasm:', value);
    };

    const handleBoldnessChange = (value) => {
        setBoldness(value);
        console.log('Boldness:', value);
    };

    const handleHumorChange = (value) => {
        setHumor(value);
        console.log('Humor:', value);
    };

    const handleArgumentativenessChange = (value) => {
        setArgumentativeness(value);
        console.log('Argumentativeness:', value);
    };

    const handleInterestToggle = (interest) => {
        setInterests((prevInterests) => {
            if (prevInterests.includes(interest)) {
                return prevInterests.filter((item) => item !== interest);
            } else {
                return [...prevInterests, interest];
            }
        });
    };

    const handleSaveSettings = async () => {
        setIsButtonActive(true);
        const settings = {
            userId,
            gender,
            talkativeness,
            sensitivity,
            enthusiasm,
            boldness,
            humor,
            argumentativeness,
            interests,
            onboardingCompleted: true, // Устанавливаем флаг онбординга
        };

        // Сохраняем настройки в Redux
        dispatch(updateSettings(settings));

        // Отправляем настройки на сервер
        try {
            console.log('Saving settings to server:', settings);
            const res = await fetch('/api/rice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            console.log('Save settings response status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            console.log('Settings saved to server');
        } catch (err) {
            console.error('Error saving settings to server:', err);
        }

        setTimeout(() => {
            navigate('/chat');
        }, 300);
    };

    const interestItems = ['кино', 'музыка', 'гейминг', 'искусство', 'литература'];

    return (
        <div className="setting-cont">
            <div className="user-block">
                <div>
                    <img src="/img/avatar.png" width={32} height={32} alt="Avatar" />
                </div>
                <div className="username">user</div>
            </div>
            <div className="heading">эмоциональный профиль rice</div>
            <div className="gender-changer">
                <GenderToggle
                    label="друг"
                    isChecked={gender === 'друг'}
                    onChange={() => handleGenderChange('друг')}
                />
                <GenderToggle
                    label="подруга"
                    isChecked={gender === 'подруга'}
                    onChange={() => handleGenderChange('подруга')}
                />
            </div>
            <div className="slider-headings">
                <div>молчаливый</div>
                <div>болтливый</div>
            </div>
            <Slider
                value={talkativeness}
                onChange={handleTalkativenessChange}
            />
            <div className="slider-headings">
                <div>рациональный</div>
                <div>чуткий</div>
            </div>
            <Slider
                value={sensitivity}
                onChange={handleSensitivityChange}
            />
            <div className="slider-headings">
                <div>скептик</div>
                <div>энтузиаст</div>
            </div>
            <Slider
                value={enthusiasm}
                onChange={handleEnthusiasmChange}
            />
            <div className="slider-headings">
                <div>вежливый</div>
                <div>дерзкий</div>
            </div>
            <Slider
                value={boldness}
                onChange={handleBoldnessChange}
            />
            <div className="slider-headings">
                <div>серьёзный</div>
                <div>шутник</div>
            </div>
            <Slider
                value={humor}
                onChange={handleHumorChange}
            />
            <div className="slider-headings">
                <div>соглашается</div>
                <div>спорит</div>
            </div>
            <Slider
                value={argumentativeness}
                onChange={handleArgumentativenessChange}
            />
            <div className="heading">
                интересы
            </div>
            <div className="interes-cont">
                {interestItems.map((interest) => (
                    <div
                        key={interest}
                        className={`inters-item ${interests.includes(interest) ? 'interes-item-active' : ''}`}
                        onClick={() => handleInterestToggle(interest)}
                    >
                        {interest}
                    </div>
                ))}
            </div>
            <div className="save-settings-btn-cont">
                <div
                    className={`save-settings-btn ${isButtonActive ? 'save-settings-btn-active' : ''}`}
                    onClick={handleSaveSettings}
                >
                    {isButtonActive ? 'готово' : 'сохранить'}
                </div>
            </div>
        </div>
    );
}