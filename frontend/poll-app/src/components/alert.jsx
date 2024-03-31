import { useState, useEffect } from 'react';
import { FaX } from 'react-icons/fa6'
import { useUserContext } from '../../context';

// Font and bg color for each alert level
const alertColor = {
    'error': ['#f44336', '#f0d8d8'],
    'info': ['#3c763d', '#dff0d8']
};

// Floats in a closeable alert for errors or info
function Alert({ message, level = 'info' }) {
    const [showAlert, setShowAlert] = useState(true);
    const { popAlert } = useUserContext();
    const [fontColor, bgColor] = alertColor[level];
    const alertStyle = {
        color: fontColor,
        backgroundColor: bgColor
    };

    // Close on click
    function handleClose() {
      setShowAlert(false);
      popAlert();
    }

    // Hides itself in two minutes
    useEffect(() => {
        const timeout = setTimeout(() => {
            setShowAlert(false);
            popAlert();
        }, 3000);

        // https://stackoverflow.com/questions/53090432/react-hooks-right-way-to-clear-timeouts-and-intervals
        return () => clearTimeout(timeout)
    }, []);

    return (
        showAlert && (
          <div className="alert-container">
            <div className='alert' style={alertStyle}>
              <span>{message}</span>
              <button className="close-button" onClick={handleClose}>
                <FaX />
              </button>
            </div>
          </div>
        )
    );
}

export default Alert;