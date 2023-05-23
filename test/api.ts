export interface Assert {
  /**
   * Asserts that actual is deeply equal to expected.
   *
   * T   Type of the objects.
   * @param actual   Actual value.
   * @param expected   Potential expected value.
   * @param message   Message to display on error.
   */
  deepEqual<T>(actual: T, expected: T, message?: string): void

  /**
   * Asserts that actual is not deeply equal to expected.
   *
   * T   Type of the objects.
   * @param actual   Actual value.
   * @param expected   Potential expected value.
   * @param message   Message to display on error.
   */
  notDeepEqual<T>(actual: T, expected: T, message?: string): void

  /**
   * Asserts non-strict equality (==) of actual and expected.
   *
   * T   Type of the objects.
   * @param actual   Actual value.
   * @param expected   Potential expected value.
   * @param message   Message to display on error.
   */
  equal<T>(actual: T, expected: T, message?: string): void

  /**
   * Asserts that object is truthy.
   *
   * T   Type of object.
   * @param object   Object to test.
   * @param message    Message to display on error.
   */
  ok<T>(value: T, message?: string): void
}

export type Test = (assert: Assert) => Promise<unknown>
export type TestSuite = { [name: string]: Test | TestSuite }
