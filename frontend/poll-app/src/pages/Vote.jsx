import Page from '../components/page'
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getPollRequest, votePollRequest } from '../utils/pollUtils';
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
            (async () => {
                try {
                    const response = await getPollRequest(poll_id);
                    const data = await response.json();

                    if (!data._id) {
                        pushAlert('Poll not found.', 'error');
                        navigate(`/vote`);
                        return;
                    } else if (!data.available) {
                        pushAlert('Poll not available', 'error');
                        navigate(`/vote`);
                        return;
                    }

                    setPollDetails(data);
                    const userResponse = data.responses.find(response => response.user === userId);
                    if (userResponse) {
                        setSelectedOption(userResponse.answer);
                    }
                } catch (error) {
                    console.error('An error occurred while fetching poll details:', error);
                    pushAlert('An error occurred while fetching poll details.', 'error');
                }
            })();
        }
    }, [pollDetails]);

    // Function to handle answer submission
    const submitAnswer = async (answerIndex) => {
        try {
            const response = await votePollRequest(poll_id, answerIndex);
            if (response.status === 200) pushAlert('Vote submitted successfully!');
            else if (response.status === 403) {
                pushAlert('Poll not available.', 'error');
            }
            else if (response.status === 400) {
                pushAlert('Invalid ID.', 'error');
            }            
            else throw new Error();

            setSelectedOption(answerIndex); // Update the selected option state
        } catch (err) {
            pushAlert('Error: Response was not recorded.', 'error');
        }
    };

    return (
        // Display poll details for /vote/:poll_id
        <Page>
            {pollDetails ? (
                <div>
                    <h2>{pollDetails.title}</h2>
                    <h3>{pollDetails.description}</h3>                    
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