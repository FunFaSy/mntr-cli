import {getTotalMoneyNeeded} from '../top-level-transaction-group'

describe('getTotalMoneyNeeded', () => {
  it('should return valid resut for depth 1', () => {
    expect(getTotalMoneyNeeded(50, 1, 0.01, 1, 1)).toBe(7677)
  })

  it('should return valid resut for depth 2', () => {
    expect(getTotalMoneyNeeded(80, 2, 0.01, 1, 1)).toBe(1228243)
  })

  it('should return valid resut for depth 3', () => {
    expect(getTotalMoneyNeeded(15, 3, 0.01, 1, 1)).toBe(23029546)
  })
})
