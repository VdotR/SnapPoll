import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../../context';
import Loading from '../components/loading';
import config from '../config';
import { clearPollRequest, getDialogText, percentOrZero, truncate } from '../utils/pollUtils';
import { Chart as ChartJS } from 'chart.js/auto'; // needed for some reason
import { Bar } from 'react-chartjs-2';
import { FaRedo, FaEraser, FaExpandAlt } from 'react-icons/fa';
import '../css/PollDetails.css';
import Dialog from '../components/dialog';
import QRCode from 'react-qr-code';

function PollDetails() {
    const navigate = useNavigate();
    const { poll_id } = useParams();
    const { pushAlert } = useUserContext();
    const [poll, setPoll] = useState(null);
    const [counts, setCounts] = useState({});
    const [correctOption, setCorrectOption] = useState(null);
    const [showCorrectOption, setShowCorrectOption] = useState(false);

    const correctOptionStyle = {
        backgroundColor: "#dff0d8"
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },    
        scales: {
            y: {
                // max: Math.max.apply(null, Object.values(counts)) + 1, 
                ticks: {
                    beginAtZero: true,
                    stepSize: 1,
                    font: {
                        size: 16
                    }
                }
            },
            x: {
                ticks: {
                    font: {
                        size: 16,
                    }
                }
            }
        }
    }

    function mapColorIfCorrect(data, correctColor, defaultColor) {
        return data.map((_, index) => {
            if (index === correctOption && showCorrectOption) {
                return correctColor;
            }
            return defaultColor;
        })
    }

    const chartLabels = Object.keys(counts)
    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Responses',
                backgroundColor: mapColorIfCorrect(chartLabels, config.BAR_GREEN, config.BAR_GREY),
                borderColor: mapColorIfCorrect(chartLabels, config.BAR_GREEN_BORDER, config.BAR_GREY_BORDER),
                borderWidth: 1,
                hoverBackgroundColor: mapColorIfCorrect(chartLabels, config.BAR_GREEN_HOVER, config.BAR_GREY_HOVER),
                hoverBorderColor: mapColorIfCorrect(chartLabels, config.BAR_GREEN_BORDER, config.BAR_GREY_BORDER), // For now same as not hovered
                data: counts
            }
        ]
    };

    function countResponses(poll){
        let newCounts = {};
        poll.options.forEach(option => {
            newCounts[option] = 0;
        });
        poll.responses.forEach(response => {
            newCounts[poll.options[response.answer]]++
        });
        return newCounts;
    }

    async function fetchPoll(id) {
        fetch(`${config.BACKEND_BASE_URL}/api/poll/${id}/`, {
            method: "GET",
            credentials: config.API_REQUEST_CREDENTIALS_SETTING
        })
        .then(res => {
            if (res.status === 401) {
                navigate("/login");
                return;
            }
            return res.json();
        })
        .then(data => {
            setPoll(data);
            setCounts(countResponses(data));
            setCorrectOption(data.correct_option);
        })
    }

    // Toggle poll availability
    async function toggleAvailable(poll) {
        try {
            const action = poll.available ? false : true;
            const response = await fetch(`${config.BACKEND_BASE_URL}/api/poll/${poll._id}/available`, {
                method: "PATCH",
                credentials: config.API_REQUEST_CREDENTIALS_SETTING,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    available: action
                })
            });
    
            if (response.status === 401) {
                navigate('/login');
                return; 
            }
            if (response.status != 200) {
                alert("Failed to change vote availability.");
                return;
            }
            fetchPoll(poll_id); // make request for shortId
            pushAlert(`${action === false ? 'Closed' : 'Opened'} poll \"${truncate(poll.question)}\"`);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function clearPoll(poll) {
        clearPollRequest(poll).then(res => {
            if (!res.ok) {
                pushAlert('Failed to clear poll responses', 'error');
            }
        })
        .then(() => pushAlert(`Cleared poll \"${truncate(poll.question)}\"`))
        .then(() => setPoll(currentPoll => ({ ...currentPoll, responses: [] })));
        const newCounts = Object.keys(counts).reduce((acc, option) => {
            acc[option] = 0;
            return acc;
        }, {});

        setCounts(newCounts);
    }
    
    useEffect(() => {
        if (!poll) fetchPoll(poll_id);
    }, []);

    const presentBtn = <button><FaExpandAlt /><span>Present</span></button>;
    const clearBtn = <button><FaEraser /><span>Clear</span></button>;

    return (
        <Page title={`Responses for \"${poll == null? '...' : truncate(poll.question)}\"`}>
            {poll == null?  <Loading /> : <>
                <div className='poll-details'>
                    <div className='responses-plot'>
                    <Bar
                        data={chartData}
                        options={chartOptions}
                    />
                    </div>
                    <div className='table-outer-container'>
                        <div className='toolbar'>
                            <button onClick={() => fetchPoll(poll_id)}><FaRedo /></button>
                            <Dialog 
                                title={"Confirm clear poll"}
                                text={getDialogText(`clear the responses for "${truncate(poll.question)}"`)}
                                target={clearBtn}
                                onConfirm={() => clearPoll(poll)}
                            />
                            <span className='toolbar-checkbox'>
                                <input type="checkbox" defaultChecked={poll.available} onChange={() => toggleAvailable(poll)} /> 
                                <span>Available</span>
                            </span>
                            {correctOption != -1 && <span className='toolbar-checkbox'>
                                <input type="checkbox" defaultChecked={showCorrectOption} onChange={() => setShowCorrectOption(!showCorrectOption)} /> 
                                <span>Show correct option</span>
                            </span>}           
                            {poll.available && <Dialog
                                title={"Vote now at <domain>/vote"}
                                text={<>
                                    {poll.shortId}
                                    <QRCode value={`http://localhost:5173/vote/${poll.shortId}`} />
                                </>}
                                target={presentBtn}
                                big
                            />}
                        </div>
                        <div className='table-container'>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Option</th>
                                        <th>Responses</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(counts).map(option => {
                                        return <tr key={option} style={poll.options.indexOf(option) == correctOption && showCorrectOption ? correctOptionStyle : {}}>
                                            <td>{truncate(option)}</td>
                                            <td>{counts[option]}</td>
                                            <td>{percentOrZero(counts[option]/poll.responses.length)}</td>
                                        </tr>
                                    })}
                                </tbody>
                            </table>
                        </div>  
                    </div>                    
                </div>
            </>}
        </Page>        
    )
}

export default PollDetails;