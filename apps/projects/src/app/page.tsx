const Home = () => {
  return (
    <main
      className={
        'container mx-auto flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 text-center'
      }
    >
      <h1 className={'text-foreground font-pixel text-lg'}>DataGSM Projects</h1>
      <p className={'text-muted-foreground mt-6 font-mono text-sm'}>
        학생 프로젝트 아카이브를 준비 중입니다.
      </p>
    </main>
  );
};

export default Home;
