import {useNavigate} from "react-router-dom";

export default function HelloPage() {

    const navigate = useNavigate();

    const handleClick = () => {
        setTimeout(() => {
            navigate('/settings')
        }, 300)
    }

    return (
        <div className='hello-cont'>
            <div className='hello-bg'>
                <img src='/img/hello_bg.png' />
            </div>
            <div className='hello-header'>rice</div>
            <div className='hello-btn' onClick={handleClick}>
                обсудим
            </div>
        </div>
    )
}