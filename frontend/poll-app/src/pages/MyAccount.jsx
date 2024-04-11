import Page from '../components/page'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePasswordRequest } from '../utils/userUtils';
import { useUserContext } from '../../context';

// As of now MyAccount's only purpose is to change user password
// 04/03/2024
function MyAccount() {
    //const navigate = useNavigate();
    const [ oldPassword, setOldPassword ] = useState("");
    const [ newPassword, setNewPassword ] = useState("");
    const [ confirmNewPassword, setConfirmNewPassword ] = useState("");
    const { pushAlert, popAlert } = useUserContext();

    async function handleChangePassword(e){
        e.preventDefault();
        // Check whether all fields are filled
        if (!newPassword || !oldPassword || !confirmNewPassword){
            pushAlert("Please fill in all fields.", 'error');
            return;
        }

        // Check if new password matches with confirm new password
        if (newPassword !== confirmNewPassword){
            pushAlert("Passwords don't match!", "error");
            return;
        }

        if (oldPassword === newPassword){
            pushAlert("New password cannot be the same as your current password", "error");
            return;
        }
        
        try {
            console.log("fetch");
            const res = await changePasswordRequest(oldPassword, newPassword);

            if (res.status === 400) {
                pushAlert(await res.text(), 'error');
            } else if (res.ok) {
                // redirect to Login Page
                popAlert();

                // For now just display a success message
                pushAlert("Password changed successfully", "info");
            
                // Not really sure if we would want to redirect to dashboard
                // navigate('/login', { state: { message: 'Password changed successfully' } });
            
                e.target.reset();
            
            } else {
                // Handle other errors or statuses here
                console.log("Error Changing Password");
            }

        } catch (err) {
            console.log(err)
        }
    }

    return (
        <Page title='My Account' centerTitle={true} hideNav={false}>
            <h2>Change Password</h2>
            <form id='change-password-form' title="Change Password" onSubmit={handleChangePassword}>
                <input name='oldPassword' type='password' onInput={e => setOldPassword(e.target.value)} placeholder='Old Password' required></input>
                <input name='newPassword' type='password' onInput={e => setNewPassword(e.target.value)} placeholder='New Password' required></input>
                <input name='confirmNewPassword' type='password' onInput={e => setConfirmNewPassword(e.target.value)} placeholder='Confirm New Password' required></input>
                <button className='submit-btn' type='submit'>
                    Change Password
                </button>
            </form>
        </Page>
    )
    
}

export default MyAccount;