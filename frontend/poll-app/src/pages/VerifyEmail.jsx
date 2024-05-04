import Page from '../components/page'
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verifyNewUser } from '../utils/userUtils';

function VerifyEmail() {
    const { token } = useParams();
    const [ status, setStatus ] = useState('Verifying your account...');

    useEffect(() => {
        verifyNewUser(token)
            .then((response) => {
                if (response.ok) {
                    setStatus(<span>Thank you for signing up! Your account has been verified. Click <a href="/">here</a> to log in.</span>);
                } else {
                    setStatus('There was an error verifying your account. Please try again.');
                }
            })
            .catch((error) => {
                console.error('Error verifying account:', error);
                setStatus('There was an error verifying your account. Please try again.');
            });
    }, [token]);

    return (
        <Page title='Account Verification' centerTitle={true} hideNav={true}>
            <div className='verify-email'>
                <p>{ status }</p>
            </div>
        </Page>
    )
}

export default VerifyEmail;