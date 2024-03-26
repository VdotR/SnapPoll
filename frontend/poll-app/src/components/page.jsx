import Header from './header'

function Page({ children, title }) {
    return (
        <>
            <Header></Header>
            <div className='content'>
                <h1 className='title'>{ title }</h1>
                { children }
            </div>
        </>
    );
}

export default Page;