let current = 0;

/** fixture마다 겹치지 않는 id. setup에서 테스트마다 초기화하므로 같은 테스트는 늘 같은 값을 얻는다. */
export const nextId = () => ++current;

export const resetFixtureIds = () => {
  current = 0;
};
