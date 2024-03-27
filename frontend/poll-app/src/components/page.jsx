import Header from './header'

function Page({ children, title, centerTitle, hideNav }) {
    const titleClass = 'title' + (centerTitle? ' center' : '')
    return (
        <>
            <Header hideNav={hideNav}></Header>
            <div className='content'>
                <h1 className={titleClass}>{ title }</h1>
                { children }
            </div>
        </>
    );
}

export default Page;