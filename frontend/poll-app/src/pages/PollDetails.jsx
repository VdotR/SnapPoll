import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../../context';
import Loading from '../components/loading';
import config from '../config';
import { truncate } from '../utils/pollUtils';
import { Chart as ChartJS } from 'chart.js/auto'; // needed for some reason
import { Bar } from 'react-chartjs-2';
import { FaRedo, FaEraser, FaTrashAlt } from 'react-icons/fa';
import '../css/PollDetails.css';

function PollDetails() {
    const navigate = useNavigate();
    const { poll_id } = useParams();
    const { pushAlert } = useUserContext();
    const [poll, setPoll] = useState(null);
    const [counts, setCounts] = useState({});
    const [correctOption, setCorrectOption] = useState(null);

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
                stepSize: 1
                }
            }
        }    
    }

    const chartData = {
        labels: Object.keys(counts),
        datasets: [
            {
                label: 'Responses',
                backgroundColor: Object.keys(counts).map((_, index) => index === correctOption ? config.BAR_GREEN : config.BAR_GREY),
                borderColor: Object.keys(counts).map((_, index) => index === correctOption ? config.BAR_GREEN_BORDER : config.BAR_GREY_BORDER),
                borderWidth: 1,
                hoverBackgroundColor: Object.keys(counts).map((_, index) => index === correctOption ? config.BAR_GREEN_HOVER : config.BAR_GREY_HOVER),
                hoverBorderColor: Object.keys(counts).map((_, index) => index === correctOption ? config.BAR_GREEN_BORDER : config.BAR_GREY_BORDER), // For now same as not hovered
                data: counts
            }
        ]
    };

    function fetchPoll(id) {
        fetch(`http://localhost:3000/api/poll/${id}/`, {
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
            console.log(data);
            setPoll(data);
            let newCounts = {};
            data.options.forEach(option => {
                newCounts[option] = 0;
            });
            data.responses.forEach(response => {
                newCounts[data.options[response.answer]]++
            });
            console.log(newCounts);
            setCounts(newCounts);
            setCorrectOption(data.correct_option);
        })
    }

    // TODO: move to common utils, also used in MyPolls
    function clearPoll(poll) {
        console.log(`http://localhost:3000/api/poll/${poll._id}/clear`)
        fetch(`http://localhost:3000/api/poll/${poll._id}/clear`, {
            method: "PATCH",
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) {
                pushAlert('Failed to clear poll responses', 'error');
            }
        })
        .then(() => pushAlert(`Cleared poll \"${truncate(poll.question)}\"`))
        .then(() => setPolls(prevPolls => prevPolls.map(p => {
            if (p._id === poll._id) {
                // Return a new object with the updated available property
                return { ...p, responses: [] };
            }
            return p;
        })))
        .catch(error => console.log(error))
    }

    useEffect(() => {
        fetchPoll(poll_id);
    }, []);

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
                            <button onClick={() => {clearPoll(poll); fetchPoll(poll_id)}}><FaEraser /> Clear responses</button>
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
                                        return <tr key={option} style={poll.options.indexOf(option) == correctOption ? correctOptionStyle : {}}>
                                            <td>{truncate(option)}</td>
                                            <td>{counts[option]}</td>
                                            <td>{(counts[option] / poll.responses.length * 100).toFixed(2) + "%"}</td>
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