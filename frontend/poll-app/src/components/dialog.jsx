
import { useState } from "react";
import "../css/dialog.css";
import { FaRegWindowMinimize } from "react-icons/fa";

// Wraps a submit button and confirmation dialog
function Dialog({
    target,
    title,
    text,
    onConfirm, 
    denyText = 'Cancel', 
    confirmText = 'Yes, continue',
    hideDeny = false,
    big = false // larger dialog for voting
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <span className="dialog-target" onClick={() => setIsOpen(true)}>
                {target}
            </span>
            {isOpen && (<div className="dialog-overlay">
                <div className={`dialog-container ${big? "dialog-big" : ""}`}>
                    {big && <div className="dialog-top">
                        <FaRegWindowMinimize onClick={() => setIsOpen(false)} />   
                    </div>}
                    <h2>{title}</h2>
                    <p>{text}</p>
                    {!big && <div className="dialog-actions">
                        {!hideDeny && <button className="dialog-cancel" onClick={() => setIsOpen(false)}>{denyText}</button>}
                        <button onClick={() => {
                            onConfirm();
                            setIsOpen(false);
                        }}>{confirmText}</button>
                    </div>}
                </div>
            </div>)}
        </>
        
    );
}

export default Dialog;