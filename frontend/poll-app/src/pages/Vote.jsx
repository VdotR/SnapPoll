import Page from '../components/page'
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { fetchPollDetails } from '../utils/pollUtils';
import config from '../config';
import Loading from '../components/loading';
import { useUserContext } from '../../context';

function Vote() {
    const navigate = useNavigate();
    const location = useLocation();
    const { poll_id } = useParams();
    const {pushAlert } = useUserContext();

    const [pollDetails, setPollDetails] = useState(location.state?.pollDetails || null);

    useEffect(() => {
        if (!pollDetails) {
            fetchPollDetails(poll_id)
            .then(data => {
                setPollDetails(data);
                
                if (data && !data._id) {
                    pushAlert('Poll not found.', 'error');
                    navigate(`/vote`);
                }
                else if (!data.available) {
                    pushAlert('Poll not available', 'error');
                    navigate(`/vote`);
                }
            })
            .catch(error => {
                console.error("Error fetching poll details:", error);
                pushAlert('An error occurred while fetching poll details.', 'error');
            });
        }
    }, [pollDetails]);

    // Function to handle answer submission
    const submitAnswer = async (answerIndex) => {
        try {
            const response = await fetch(`${config.BACKEND_BASE_URL}/api/poll/vote/${poll_id}`, {
                method: "PATCH",
                credentials: config.API_REQUEST_CREDENTIALS_SETTING,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    answer: answerIndex,
                })
            });

            if (response.status === 400) {
                throw new Error('Poll not available.');
            }
            else if (response.status === 500) {
                throw new Error('Error: Response was not recorded.');
            }
            const result = await response.json();
            pushAlert('Vote submitted successfully!');
        } catch (error) {
            console.error("Error submitting vote:", error);
            pushAlert(error.message, 'error');
        }
    };

    return (
        // Display poll details for /vote/:poll_id
        <Page>
            {pollDetails ? (
                <div>
                    <h2>{pollDetails.question}</h2>
                    <div>
                        {pollDetails.options.map((option, index) => (
                            <button key={index} onClick={() => submitAnswer(index)}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <Loading />
            )}
        </Page>
    );

}

export default Vote;