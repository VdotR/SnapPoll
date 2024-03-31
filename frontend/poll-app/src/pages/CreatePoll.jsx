import Page from '../components/page'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsFillTrash3Fill } from "react-icons/bs";
import { useUserContext } from '../../context';

import config from '../config';

// Constants
const MAX_QUESTION_LENGTH = 200;
const MAX_OPTION_LENGTH = 80;


function CreatePoll() {
    const navigate = useNavigate();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['']);
    const [correctOption, setCorrectOption] = useState(null);
    const {pushAlert } = useUserContext();

    const handleQuestionChange = (event) => {
        setQuestion(event.target.value);
    };

    const handleOptionChange = (index, event) => {
        const newOptions = options.map((option, optIndex) => {
            if (index === optIndex) {
                return event.target.value;
            }
            return option;
        });
        setOptions(newOptions);
    };

    const handleCorrectOptionChange = (index) => {
        setCorrectOption(index)
    }

    const addOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index) => {      
        if (options.length > 1) {
            if (index === correctOption){
                // Clear correct option if deleted old correct option
                setCorrectOption(null); 
            } else if (index < correctOption){
                // Has to move correct option up if deleted options above correct option
                setCorrectOption(correctOption - 1); 
            }
            const newOptions = options.filter((_, optIndex) => index !== optIndex);
            setOptions(newOptions);

            console.log(options);
        } else {
            pushAlert('There must be at least one option.', 'error');
        }
    };

    const handleSubmit = async () => {
        // Edge Cases
        if (correctOption === null) {
            pushAlert("You need to select a correct option!" , 'error')
            return;
        }

        if (question === null){
            pushAlert("Question should not be null!" , 'error')
            return;
        } else if (question.length > MAX_QUESTION_LENGTH){
            pushAlert(`Question is too long! Max question length is ${MAX_QUESTION_LENGTH} characters while current question has ${question.length} characters` , 'error');
        }
        
        for (let i = 0; i < options.length; i++){
            if (options[i] === ""){
                pushAlert("Please fill in all options.", 'error');
                return;
            } else if (options[i].length > MAX_OPTION_LENGTH){
                pushAlert(`Option is too long! Each option should be under ${MAX_OPTION_LENGTH} characters`, 'error');
                return;
            }
        }

        try {
            const response = await fetch(`${config.BACKEND_BASE_URL}/api/poll`, {
                method: 'POST',
                credentials: config.API_REQUEST_CREDENTIALS_SETTING,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    correct_option: correctOption,
                    options
                }),
            });

            if (response.ok) {
                const newPoll = await response.json();
                pushAlert('Poll created successfully!');
                console.log("created" + newPoll);
                // Redirect to polls page
                navigate("/polls");
            } else {
                pushAlert('Failed to create the poll.', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            pushAlert('Error creating the poll.', 'error');
        }
    };

    return (
        <Page>
            <form>
            <div>
                <input
                    type="text"
                    value={question}
                    placeholder='Question'
                    onChange={handleQuestionChange}
                    className='create-poll-question'
                />
            </div>
            <table className='poll-table'>
            <tbody>
                {options.map((option, index) => (
                <tr key={index} className='custom-row'>
                    <td className='checkbox-cell'>
                        <input
                            type="checkbox"
                            checked={correctOption === index}
                            onChange={() => handleCorrectOptionChange(index)}
                            className="checkbox"
                        />
                    </td>
                    <td className='textbox-cell'>
                        <input
                            type="text"
                            value={option}
                            placeholder={`Option ${index + 1}`}
                            onChange={(event) => handleOptionChange(index, event)}
                            className='dynamic-textbox'
                        />
                    </td>
                    <td className='delete-button-cell"'>
                        <button type="button" onClick={() => handleRemoveOption(index) } className="delete-button">
                            <BsFillTrash3Fill />
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <button type="button" onClick={addOption} className='create-poll-button'>
                Add Option
            </button>
            <button type="button" onClick={handleSubmit} className='create-poll-button'>
                Create Poll
            </button>
        </form>
        </Page>
       
    );
}


export default CreatePoll;