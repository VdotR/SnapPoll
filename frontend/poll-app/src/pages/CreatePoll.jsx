import Page from '../components/page'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Constants
const MAX_QUESTION_LENGTH = 200;
const MAX_OPTION_LENGTH = 80;


function CreatePoll() {
    const navigate = useNavigate();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['']);
    const [correctOption, setCorrectOption] = useState(null);

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

    const removeOption = (index) => {
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
        } else {
            alert('There must be at least one option.');
        }
    };

    const handleSubmit = async () => {
        // Edge Cases
        if (correctOption === null) {
            alert("You need to select a correct option!")
            return;
        }

        if (question === null){
            alert("Question should not be null!")
            return;
        } else if (question.length > MAX_QUESTION_LENGTH){
            alert(`Question is too long! Max question length is ${MAX_QUESTION_LENGTH} characters while current question has ${question.length} characters`);
        }
        
        for (let i = 0; i < options.length; i++){
            if (options[i] === ""){
                alert("Option cannot be null!");
                return;
            } else if (options[i].length > MAX_OPTION_LENGTH){
                alert(`Option is too long! Each option should be under ${MAX_OPTION_LENGTH} characters`);
                return;
            }
        }

        try {
            const response = await fetch('http://localhost:3000/api/poll', {
                method: 'POST',
                credentials: "include",
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
                //alert('Poll created successfully!');
                console.log("created" + newPoll);
                // Redirect to polls page
                navigate("/polls");
            } else {
                alert('Failed to create the poll.');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error creating the poll.');
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
                />
            </div>
            {options.map((option, index) => (
                <div key={index}>
                    <div className = "option">
                        <div className='left'>
                            <input 
                                type="checkbox"
                                checked={correctOption===index}
                                onChange={() => handleCorrectOptionChange(index)}
                            />
                        </div>
                        <div className='middle'>
                            <input
                            type="text"
                            value={option}
                            placeholder={`Option ${index+1}`}
                            onChange={(event) => handleOptionChange(index, event)}/>
                        </div>
                        <div className='right'>
                            <button type="button" className='side_button' onClick={() => removeOption(index)}>
                                ✖
                            </button>
                        </div>
                    </div>
                    
                </div>
            ))}
            <button type="button" onClick={addOption}>
                Add Option
            </button>
            <button type="button" onClick={handleSubmit}>
                Create Poll
            </button>
        </form>
        </Page>
       
    );
}

export default CreatePoll;