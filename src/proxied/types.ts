import { Observable as Obs } from "../Observable"
import { EventStream as Stream } from "../EventStream"
import { Property as Prop } from "../Property"
import { Atom as A } from "../Atom"

// tslint:disable:max-line-length member-ordering unified-signatures array-type no-namespace

export namespace Proxied {
  export interface StringObservable {
    /** Returns a string representation of a string. */
    toString(): Proxied.Observable<string>

    /**
     * Returns the character at the specified index.
     * @param pos The zero-based index of the desired character.
     */
    charAt(pos: number): Proxied.Observable<string>

    /**
     * Returns the Unicode value of the character at the specified location.
     * @param index The zero-based index of the desired character. If there is no character at the specified index, NaN is returned.
     */
    charCodeAt(index: number): Proxied.Observable<number>

    /**
     * Returns the position of the first occurrence of a substring.
     * @param searchString The substring to search for in the string
     * @param position The index at which to begin searching the String object. If omitted, search starts at the beginning of the string.
     */
    indexOf(searchString: string, position?: number): Proxied.Observable<number>

    /**
     * Returns the last occurrence of a substring in the string.
     * @param searchString The substring to search for.
     * @param position The index at which to begin searching. If omitted, the search begins at the end of the string.
     */
    lastIndexOf(searchString: string, position?: number): Proxied.Observable<number>

    /**
     * Determines whether two strings are equivalent in the current locale.
     * @param that String to compare to target string
     */
    localeCompare(that: string): Proxied.Observable<number>

    /**
     * Matches a string with a regular expression, and returns an array containing the results of that search.
     * @param regexp A variable name or string literal containing the regular expression pattern and flags.
     */
    match(regexp: string | RegExp): Obs<RegExpMatchArray | null>

    /**
     * Replaces text in a string, using a regular expression or search string.
     * @param searchValue A string to search for.
     * @param replaceValue A string containing the text to replace for every successful match of searchValue in this string.
     */
    replace(searchValue: string | RegExp, replaceValue: string): Proxied.Observable<string>

    /**
     * Replaces text in a string, using a regular expression or search string.
     * @param searchValue A string to search for.
     * @param replacer A function that returns the replacement text.
     */
    replace(
      searchValue: string | RegExp,
      replacer: (substring: string, ...args: any[]) => string,
    ): Proxied.Observable<string>

    /**
     * Finds the first substring match in a regular expression search.
     * @param regexp The regular expression pattern and applicable flags.
     */
    search(regexp: string | RegExp): Proxied.Observable<number>

    /**
     * Returns a section of a string.
     * @param start The index to the beginning of the specified portion of stringObj.
     * @param end The index to the end of the specified portion of stringObj. The substring includes the characters up to, but not including, the character indicated by end.
     * If this value is not specified, the substring continues to the end of stringObj.
     */
    slice(start?: number, end?: number): Proxied.Observable<string>

    /**
     * Split a string into substrings using the specified separator and return them as an array.
     * @param separator A string that identifies character or characters to use in separating the string. If omitted, a single-element array containing the entire string is returned.
     * @param limit A value used to limit the number of elements returned in the array.
     */
    split(separator: string | RegExp, limit?: number): Proxied.Observable<string[]>

    /**
     * Returns the substring at the specified location within a String object.
     * @param start The zero-based index number indicating the beginning of the substring.
     * @param end Zero-based index number indicating the end of the substring. The substring includes the characters up to, but not including, the character indicated by end.
     * If end is omitted, the characters from start through the end of the original string are returned.
     */
    substring(start: number, end?: number): Proxied.Observable<string>

    /** Converts all the alphabetic characters in a string to lowercase. */
    toLowerCase(): Proxied.Observable<string>

    /** Converts all alphabetic characters to lowercase, taking into account the host environment's current locale. */
    toLocaleLowerCase(): Proxied.Observable<string>

    /** Converts all the alphabetic characters in a string to uppercase. */
    toUpperCase(): Proxied.Observable<string>

    /** Returns a string where all alphabetic characters have been converted to uppercase, taking into account the host environment's current locale. */
    toLocaleUpperCase(): Proxied.Observable<string>

    /** Removes the leading and trailing white space and line terminator characters from a string. */
    trim(): Proxied.Observable<string>

    /** Returns the length of a String object. */

    readonly length: Proxied.Observable<number>

    // IE extensions
    /**
     * Gets a substring beginning at the specified location and having the specified length.
     * @param from The starting position of the desired substring. The index of the first character in the string is zero.
     * @param length The number of characters to include in the returned substring.
     */
    substr(from: number, length?: number): Proxied.Observable<string>
  }

  export interface ArrayObservable<T> {
    /**
     * Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.
     */
    length: Proxied.Observable<number>
    /**
     * Returns a string representation of an array.
     */
    toString(): Proxied.Observable<string>
    /**
     * Returns a string representation of an array. The elements are converted to string using their toLocalString methods.
     */
    toLocaleString(): Proxied.Observable<string>
    /**
     * Combines two or more arrays.
     * @param items Additional items to add to the end of array1.
     */
    concat(...items: ConcatArray<T>[]): Proxied.Observable<T[]>
    /**
     * Combines two or more arrays.
     * @param items Additional items to add to the end of array1.
     */
    concat(...items: (T | ConcatArray<T>)[]): Proxied.Observable<T[]>
    /**
     * Adds all the elements of an array separated by the specified separator string.
     * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
     */
    join(separator?: string): Proxied.Observable<string>
    /**
     * Returns a section of an array.
     * @param start The beginning of the specified portion of the array.
     * @param end The end of the specified portion of the array.
     */
    slice(start?: number, end?: number): Proxied.Observable<T[]>
    /**
     * Returns the index of the first occurrence of a value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    indexOf(searchElement: T, fromIndex?: number): Proxied.Observable<number>
    /**
     * Returns the index of the last occurrence of a specified value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
     */
    lastIndexOf(searchElement: T, fromIndex?: number): Proxied.Observable<number>
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    every(
      callbackfn: (value: T, index: number, array: T[]) => boolean,
      thisArg?: any,
    ): Proxied.Observable<boolean>
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    some(
      callbackfn: (value: T, index: number, array: T[]) => boolean,
      thisArg?: any,
    ): Proxied.Observable<boolean>
    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map<U>(
      callbackfn: (value: T, index: number, array: T[]) => U,
      thisArg?: any,
    ): Proxied.Observable<U[]>
    /**
     * Returns the elements of an array that meet the condition specified in a callback function.
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter<S extends T>(
      callbackfn: (value: T, index: number, array: T[]) => value is S,
      thisArg?: any,
    ): Proxied.Observable<S[]>
    /**
     * Returns the elements of an array that meet the condition specified in a callback function.
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter(
      callbackfn: (value: T, index: number, array: T[]) => any,
      thisArg?: any,
    ): Proxied.Observable<T[]>
    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    ): Proxied.Observable<T>
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
      initialValue: T,
    ): Proxied.Observable<T>
    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce<U>(
      callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): Proxied.Observable<U>
    /**
     * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduceRight(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    ): Proxied.Observable<T>
    reduceRight(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
      initialValue: T,
    ): Proxied.Observable<T>
    /**
     * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduceRight<U>(
      callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): Proxied.Observable<U>

    [n: number]: Proxied.Observable<T>
  }

  export interface NumberObservable {
    /**
     * Returns a string representation of an object.
     * @param radix Specifies a radix for converting numeric values to strings. This value is only used for numbers.
     */
    toString(radix?: number): Proxied.Observable<string>

    /**
     * Returns a string representing a number in fixed-point notation.
     * @param fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     */
    toFixed(fractionDigits?: number): Proxied.Observable<string>

    /**
     * Returns a string containing a number represented in exponential notation.
     * @param fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     */
    toExponential(fractionDigits?: number): Proxied.Observable<string>

    /**
     * Returns a string containing a number represented either in exponential or fixed-point notation with a specified number of digits.
     * @param precision Number of significant digits. Must be in the range 1 - 21, inclusive.
     */
    toPrecision(precision?: number): Proxied.Observable<string>
  }

  export type BooleanObservable = Obs<boolean>

  export type Observable<T> = Obs<T> &
    (T extends string
      ? StringObservable
      : T extends number
      ? NumberObservable
      : T extends boolean
      ? BooleanObservable
      : T extends Array<infer E>
      ? ArrayObservable<E>
      : T extends object
      ? { [K in keyof T]: Proxied.Observable<T[K]> }
      : Obs<T>)

  export interface StringEventStream {
    /** Returns a string representation of a string. */
    toString(): Proxied.EventStream<string>

    /**
     * Returns the character at the specified index.
     * @param pos The zero-based index of the desired character.
     */
    charAt(pos: number): Proxied.EventStream<string>

    /**
     * Returns the Unicode value of the character at the specified location.
     * @param index The zero-based index of the desired character. If there is no character at the specified index, NaN is returned.
     */
    charCodeAt(index: number): Proxied.EventStream<number>

    /**
     * Returns the position of the first occurrence of a substring.
     * @param searchString The substring to search for in the string
     * @param position The index at which to begin searching the String object. If omitted, search starts at the beginning of the string.
     */
    indexOf(searchString: string, position?: number): Proxied.EventStream<number>

    /**
     * Returns the last occurrence of a substring in the string.
     * @param searchString The substring to search for.
     * @param position The index at which to begin searching. If omitted, the search begins at the end of the string.
     */
    lastIndexOf(searchString: string, position?: number): Proxied.EventStream<number>

    /**
     * Determines whether two strings are equivalent in the current locale.
     * @param that String to compare to target string
     */
    localeCompare(that: string): Proxied.EventStream<number>

    /**
     * Matches a string with a regular expression, and returns an array containing the results of that search.
     * @param regexp A variable name or string literal containing the regular expression pattern and flags.
     */
    match(regexp: string | RegExp): EventStream<RegExpMatchArray | null>

    /**
     * Replaces text in a string, using a regular expression or search string.
     * @param searchValue A string to search for.
     * @param replaceValue A string containing the text to replace for every successful match of searchValue in this string.
     */
    replace(searchValue: string | RegExp, replaceValue: string): Proxied.EventStream<string>

    /**
     * Replaces text in a string, using a regular expression or search string.
     * @param searchValue A string to search for.
     * @param replacer A function that returns the replacement text.
     */
    replace(
      searchValue: string | RegExp,
      replacer: (substring: string, ...args: any[]) => string,
    ): Proxied.EventStream<string>

    /**
     * Finds the first substring match in a regular expression search.
     * @param regexp The regular expression pattern and applicable flags.
     */
    search(regexp: string | RegExp): Proxied.EventStream<number>

    /**
     * Returns a section of a string.
     * @param start The index to the beginning of the specified portion of stringObj.
     * @param end The index to the end of the specified portion of stringObj. The substring includes the characters up to, but not including, the character indicated by end.
     * If this value is not specified, the substring continues to the end of stringObj.
     */
    slice(start?: number, end?: number): Proxied.EventStream<string>

    /**
     * Split a string into substrings using the specified separator and return them as an array.
     * @param separator A string that identifies character or characters to use in separating the string. If omitted, a single-element array containing the entire string is returned.
     * @param limit A value used to limit the number of elements returned in the array.
     */
    split(separator: string | RegExp, limit?: number): Proxied.EventStream<string[]>

    /**
     * Returns the substring at the specified location within a String object.
     * @param start The zero-based index number indicating the beginning of the substring.
     * @param end Zero-based index number indicating the end of the substring. The substring includes the characters up to, but not including, the character indicated by end.
     * If end is omitted, the characters from start through the end of the original string are returned.
     */
    substring(start: number, end?: number): Proxied.EventStream<string>

    /** Converts all the alphabetic characters in a string to lowercase. */
    toLowerCase(): Proxied.EventStream<string>

    /** Converts all alphabetic characters to lowercase, taking into account the host environment's current locale. */
    toLocaleLowerCase(): Proxied.EventStream<string>

    /** Converts all the alphabetic characters in a string to uppercase. */
    toUpperCase(): Proxied.EventStream<string>

    /** Returns a string where all alphabetic characters have been converted to uppercase, taking into account the host environment's current locale. */
    toLocaleUpperCase(): Proxied.EventStream<string>

    /** Removes the leading and trailing white space and line terminator characters from a string. */
    trim(): Proxied.EventStream<string>

    /** Returns the length of a String object. */

    readonly length: Proxied.EventStream<number>

    // IE extensions
    /**
     * Gets a substring beginning at the specified location and having the specified length.
     * @param from The starting position of the desired substring. The index of the first character in the string is zero.
     * @param length The number of characters to include in the returned substring.
     */
    substr(from: number, length?: number): Proxied.EventStream<string>
  }

  export interface ArrayEventStream<T> {
    /**
     * Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.
     */
    length: Proxied.EventStream<number>
    /**
     * Returns a string representation of an array.
     */
    toString(): Proxied.EventStream<string>
    /**
     * Returns a string representation of an array. The elements are converted to string using their toLocalString methods.
     */
    toLocaleString(): Proxied.EventStream<string>
    /**
     * Combines two or more arrays.
     * @param items Additional items to add to the end of array1.
     */
    concat(...items: ConcatArray<T>[]): Proxied.EventStream<T[]>
    /**
     * Combines two or more arrays.
     * @param items Additional items to add to the end of array1.
     */
    concat(...items: (T | ConcatArray<T>)[]): Proxied.EventStream<T[]>
    /**
     * Adds all the elements of an array separated by the specified separator string.
     * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
     */
    join(separator?: string): Proxied.EventStream<string>
    /**
     * Returns a section of an array.
     * @param start The beginning of the specified portion of the array.
     * @param end The end of the specified portion of the array.
     */
    slice(start?: number, end?: number): Proxied.EventStream<T[]>
    /**
     * Returns the index of the first occurrence of a value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    indexOf(searchElement: T, fromIndex?: number): Proxied.EventStream<number>
    /**
     * Returns the index of the last occurrence of a specified value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
     */
    lastIndexOf(searchElement: T, fromIndex?: number): Proxied.EventStream<number>
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    every(
      callbackfn: (value: T, index: number, array: T[]) => boolean,
      thisArg?: any,
    ): Proxied.EventStream<boolean>
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    some(
      callbackfn: (value: T, index: number, array: T[]) => boolean,
      thisArg?: any,
    ): Proxied.EventStream<boolean>
    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map<U>(
      callbackfn: (value: T, index: number, array: T[]) => U,
      thisArg?: any,
    ): Proxied.EventStream<U[]>
    /**
     * Returns the elements of an array that meet the condition specified in a callback function.
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter<S extends T>(
      callbackfn: (value: T, index: number, array: T[]) => value is S,
      thisArg?: any,
    ): Proxied.EventStream<S[]>
    /**
     * Returns the elements of an array that meet the condition specified in a callback function.
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter(
      callbackfn: (value: T, index: number, array: T[]) => any,
      thisArg?: any,
    ): Proxied.EventStream<T[]>
    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    ): Proxied.EventStream<T>
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
      initialValue: T,
    ): Proxied.EventStream<T>
    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce<U>(
      callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): Proxied.EventStream<U>
    /**
     * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduceRight(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    ): Proxied.EventStream<T>
    reduceRight(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
      initialValue: T,
    ): Proxied.EventStream<T>
    /**
     * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduceRight<U>(
      callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): Proxied.EventStream<U>

    [n: number]: Proxied.EventStream<T>
  }

  export interface NumberEventStream {
    /**
     * Returns a string representation of an object.
     * @param radix Specifies a radix for converting numeric values to strings. This value is only used for numbers.
     */
    toString(radix?: number): Proxied.EventStream<string>

    /**
     * Returns a string representing a number in fixed-point notation.
     * @param fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     */
    toFixed(fractionDigits?: number): Proxied.EventStream<string>

    /**
     * Returns a string containing a number represented in exponential notation.
     * @param fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     */
    toExponential(fractionDigits?: number): Proxied.EventStream<string>

    /**
     * Returns a string containing a number represented either in exponential or fixed-point notation with a specified number of digits.
     * @param precision Number of significant digits. Must be in the range 1 - 21, inclusive.
     */
    toPrecision(precision?: number): Proxied.EventStream<string>
  }

  export type BooleanEventStream = Stream<boolean>

  export type EventStream<T> = Stream<T> &
    (T extends string
      ? StringEventStream
      : T extends number
      ? NumberEventStream
      : T extends boolean
      ? BooleanEventStream
      : T extends Array<infer E>
      ? ArrayEventStream<E>
      : T extends object
      ? { [K in keyof T]: Proxied.EventStream<T[K]> }
      : Stream<T>)

  export interface StringProperty {
    /** Returns a string representation of a string. */
    toString(): Proxied.Property<string>

    /**
     * Returns the character at the specified index.
     * @param pos The zero-based index of the desired character.
     */
    charAt(pos: number): Proxied.Property<string>

    /**
     * Returns the Unicode value of the character at the specified location.
     * @param index The zero-based index of the desired character. If there is no character at the specified index, NaN is returned.
     */
    charCodeAt(index: number): Proxied.Property<number>

    /**
     * Returns the position of the first occurrence of a substring.
     * @param searchString The substring to search for in the string
     * @param position The index at which to begin searching the String object. If omitted, search starts at the beginning of the string.
     */
    indexOf(searchString: string, position?: number): Proxied.Property<number>

    /**
     * Returns the last occurrence of a substring in the string.
     * @param searchString The substring to search for.
     * @param position The index at which to begin searching. If omitted, the search begins at the end of the string.
     */
    lastIndexOf(searchString: string, position?: number): Proxied.Property<number>

    /**
     * Determines whether two strings are equivalent in the current locale.
     * @param that String to compare to target string
     */
    localeCompare(that: string): Proxied.Property<number>

    /**
     * Matches a string with a regular expression, and returns an array containing the results of that search.
     * @param regexp A variable name or string literal containing the regular expression pattern and flags.
     */
    match(regexp: string | RegExp): Property<RegExpMatchArray | null>

    /**
     * Replaces text in a string, using a regular expression or search string.
     * @param searchValue A string to search for.
     * @param replaceValue A string containing the text to replace for every successful match of searchValue in this string.
     */
    replace(searchValue: string | RegExp, replaceValue: string): Proxied.Property<string>

    /**
     * Replaces text in a string, using a regular expression or search string.
     * @param searchValue A string to search for.
     * @param replacer A function that returns the replacement text.
     */
    replace(
      searchValue: string | RegExp,
      replacer: (substring: string, ...args: any[]) => string,
    ): Proxied.Property<string>

    /**
     * Finds the first substring match in a regular expression search.
     * @param regexp The regular expression pattern and applicable flags.
     */
    search(regexp: string | RegExp): Proxied.Property<number>

    /**
     * Returns a section of a string.
     * @param start The index to the beginning of the specified portion of stringObj.
     * @param end The index to the end of the specified portion of stringObj. The substring includes the characters up to, but not including, the character indicated by end.
     * If this value is not specified, the substring continues to the end of stringObj.
     */
    slice(start?: number, end?: number): Proxied.Property<string>

    /**
     * Split a string into substrings using the specified separator and return them as an array.
     * @param separator A string that identifies character or characters to use in separating the string. If omitted, a single-element array containing the entire string is returned.
     * @param limit A value used to limit the number of elements returned in the array.
     */
    split(separator: string | RegExp, limit?: number): Proxied.Property<string[]>

    /**
     * Returns the substring at the specified location within a String object.
     * @param start The zero-based index number indicating the beginning of the substring.
     * @param end Zero-based index number indicating the end of the substring. The substring includes the characters up to, but not including, the character indicated by end.
     * If end is omitted, the characters from start through the end of the original string are returned.
     */
    substring(start: number, end?: number): Proxied.Property<string>

    /** Converts all the alphabetic characters in a string to lowercase. */
    toLowerCase(): Proxied.Property<string>

    /** Converts all alphabetic characters to lowercase, taking into account the host environment's current locale. */
    toLocaleLowerCase(): Proxied.Property<string>

    /** Converts all the alphabetic characters in a string to uppercase. */
    toUpperCase(): Proxied.Property<string>

    /** Returns a string where all alphabetic characters have been converted to uppercase, taking into account the host environment's current locale. */
    toLocaleUpperCase(): Proxied.Property<string>

    /** Removes the leading and trailing white space and line terminator characters from a string. */
    trim(): Proxied.Property<string>

    /** Returns the length of a String object. */

    readonly length: Proxied.Property<number>

    // IE extensions
    /**
     * Gets a substring beginning at the specified location and having the specified length.
     * @param from The starting position of the desired substring. The index of the first character in the string is zero.
     * @param length The number of characters to include in the returned substring.
     */
    substr(from: number, length?: number): Proxied.Property<string>
  }

  export interface ArrayProperty<T> {
    /**
     * Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.
     */
    length: Proxied.Property<number>
    /**
     * Returns a string representation of an array.
     */
    toString(): Proxied.Property<string>
    /**
     * Returns a string representation of an array. The elements are converted to string using their toLocalString methods.
     */
    toLocaleString(): Proxied.Property<string>
    /**
     * Combines two or more arrays.
     * @param items Additional items to add to the end of array1.
     */
    concat(...items: ConcatArray<T>[]): Proxied.Property<T[]>
    /**
     * Combines two or more arrays.
     * @param items Additional items to add to the end of array1.
     */
    concat(...items: (T | ConcatArray<T>)[]): Proxied.Property<T[]>
    /**
     * Adds all the elements of an array separated by the specified separator string.
     * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
     */
    join(separator?: string): Proxied.Property<string>
    /**
     * Returns a section of an array.
     * @param start The beginning of the specified portion of the array.
     * @param end The end of the specified portion of the array.
     */
    slice(start?: number, end?: number): Proxied.Property<T[]>
    /**
     * Returns the index of the first occurrence of a value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    indexOf(searchElement: T, fromIndex?: number): Proxied.Property<number>
    /**
     * Returns the index of the last occurrence of a specified value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
     */
    lastIndexOf(searchElement: T, fromIndex?: number): Proxied.Property<number>
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    every(
      callbackfn: (value: T, index: number, array: T[]) => boolean,
      thisArg?: any,
    ): Proxied.Property<boolean>
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    some(
      callbackfn: (value: T, index: number, array: T[]) => boolean,
      thisArg?: any,
    ): Proxied.Property<boolean>
    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map<U>(
      callbackfn: (value: T, index: number, array: T[]) => U,
      thisArg?: any,
    ): Proxied.Property<U[]>
    /**
     * Returns the elements of an array that meet the condition specified in a callback function.
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter<S extends T>(
      callbackfn: (value: T, index: number, array: T[]) => value is S,
      thisArg?: any,
    ): Proxied.Property<S[]>
    /**
     * Returns the elements of an array that meet the condition specified in a callback function.
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter(
      callbackfn: (value: T, index: number, array: T[]) => any,
      thisArg?: any,
    ): Proxied.Property<T[]>
    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    ): Proxied.Property<T>
    reduce(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
      initialValue: T,
    ): Proxied.Property<T>
    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce<U>(
      callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): Proxied.Property<U>
    /**
     * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduceRight(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    ): Proxied.Property<T>
    reduceRight(
      callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
      initialValue: T,
    ): Proxied.Property<T>
    /**
     * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduceRight<U>(
      callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
      initialValue: U,
    ): Proxied.Property<U>
  }

  export interface IndexableProperty<T> {
    [n: number]: Proxied.Property<T>
  }

  export interface NumberProperty {
    /**
     * Returns a string representation of an object.
     * @param radix Specifies a radix for converting numeric values to strings. This value is only used for numbers.
     */
    toString(radix?: number): Proxied.Property<string>

    /**
     * Returns a string representing a number in fixed-point notation.
     * @param fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     */
    toFixed(fractionDigits?: number): Proxied.Property<string>

    /**
     * Returns a string containing a number represented in exponential notation.
     * @param fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     */
    toExponential(fractionDigits?: number): Proxied.Property<string>

    /**
     * Returns a string containing a number represented either in exponential or fixed-point notation with a specified number of digits.
     * @param precision Number of significant digits. Must be in the range 1 - 21, inclusive.
     */
    toPrecision(precision?: number): Proxied.Property<string>
  }

  export type BooleanProperty = Prop<boolean>

  export type Property<T> = Prop<T> &
    (T extends string
      ? StringProperty
      : T extends number
      ? NumberProperty
      : T extends boolean
      ? BooleanProperty
      : T extends Array<infer E>
      ? (ArrayProperty<E> & IndexableProperty<E>)
      : T extends object
      ? { [K in keyof T]: Proxied.Property<T[K]> }
      : Prop<T>)

  export interface StringAtom extends Proxied.StringProperty {}

  export interface ArrayAtom<T> extends Proxied.ArrayProperty<T> {
    [n: number]: Proxied.Atom<T>
  }

  export interface NumberAtom extends Proxied.NumberProperty {}

  export type BooleanAtom = A<boolean>

  export type Atom<T> = A<T> &
    (T extends string
      ? StringAtom
      : T extends number
      ? NumberAtom
      : T extends boolean
      ? BooleanAtom
      : T extends Array<infer E>
      ? ArrayAtom<E>
      : T extends object
      ? { [K in keyof T]: Proxied.Atom<T[K]> }
      : A<T>)
}
