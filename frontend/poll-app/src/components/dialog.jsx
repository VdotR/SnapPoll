
import { useState } from "react";
import "../css/dialog.css";

// Wraps a submit button and confirmation dialog
// TODO: generalize to any buttons (e.g. poll delete/clear)
function Dialog({target, title, text, onConfirm, denyText = 'Cancel', confirmText = 'Yes, continue'}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <span onClick={() => setIsOpen(true)}>
                {target}
            </span>
            {isOpen && (<div className="dialog-overlay">
                <div className="dialog-container">
                    <h2>{title}</h2>
                    <p>{text}</p>
                    <div className="dialog-actions">
                        <button onClick={() => setIsOpen(false)}>{denyText}</button>
                        <button onClick={() => {
                            onConfirm();
                            setIsOpen(false);
                        }}>{confirmText}</button>
                    </div>
                </div>
            </div>)}
        </>
        
    );
}

export default Dialog;