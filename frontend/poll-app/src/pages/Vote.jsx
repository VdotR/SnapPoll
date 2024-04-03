import Page from '../components/page'
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { fetchPollDetails } from '../utils/pollUtils';
import config from '../config';
import Loading from '../components/loading';
import { useUserContext } from '../../context';
import '../css/Vote.css';

function Vote() {
    const navigate = useNavigate();
    const location = useLocation();
    const { poll_id } = useParams();
    const { userId, pushAlert } = useUserContext();

    const [pollDetails, setPollDetails] = useState(location.state?.pollDetails || null);
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        if (!pollDetails) {
            fetchPollDetails(poll_id)
                .then(data => {
                    const userResponse = data.responses.find(response => response.user === userId);
                    setPollDetails(data);
                    setSelectedOption(userResponse.answer);

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
            setSelectedOption(answerIndex); // Update the selected option state
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
                    <div className="voteOptionsContainer"> {/* Apply the container class */}
                        {pollDetails.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => submitAnswer(index)}
                                className={`voteOption ${selectedOption === index ? 'selected' : ''}`}
                            >
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