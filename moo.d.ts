export as namespace moo;

/**
 * Reserved token for indicating a parse fail.
 */
export const error: { error: true };

/**
 * Reserved token for indicating a fallback rule.
 */

export type Category = {
	isCategory: boolean,
	categoryName: string,
	categories: Category[] | null,
}

export interface TokenDefinition {
	type: string,
	categories: Category[] | null,
}

export function compile(rules: Rules): Lexer;

export function states(states: {[x: string]: Rules}, start?: string): Lexer;

export type TokenOrCategory = TokenDefinition | Category;
export function matchToken(testToken: Token, matchTokenOrCategory: TokenOrCategory);
export function matchTokens(testTokens: Token[], matchTokensOrCategories: TokenOrCategory[]);
export function createCategory(categoryName: string, parentCategories?: Category | Category[]);


export interface Rule {
	match?: RegExp | string | string[];
	/**
	 * Moo tracks detailed information about the input for you.
	 * It will track line numbers, as long as you apply the `lineBreaks: true`
	 * option to any tokens which might contain newlines. Moo will try to warn you if you forget to do this.
	 */
	lineBreaks?: boolean;
	/**
	 * Moves the lexer to a new state, and pushes the old state onto the stack.
	 */
	push?: string;
	/**
	 * Returns to a previous state, by removing one or more states from the stack.
	 */
	pop?: number;
	/**
	 * Moves to a new state, but does not affect the stack.
	 */
	next?: string;
	/**
	 * You can have a token type that both matches tokens and contains error values.
	 */
	error?: true;
	/**
	 * Moo doesn't allow capturing groups, but you can supply a transform function, value(),
	 * which will be called on the value before storing it in the Token object.
	 */
	value?: (x: string) => string;

	categories?: Category | Category[];

	ignore?: true;

	keywords?: {
		[keywordType: string]: string | string[] | {
			values: string | string[], categories: Category | Category[],
		} 
	};
}

export interface Rules {
	[x: string]: RegExp | string | string[] | Rule | Rule[];
}

export interface Lexer {
	/**
	 * Returns a string with a pretty error message.
	 */
	formatError(token: Token, message?: string): string;
	/**
	 * Can be used by parsers like nearley to check whether a given token type can be parsed by this lexer.
	 */
	has(tokenType: string): boolean;
	/**
	 * When you reach the end of Moo's internal buffer, next() will return undefined.
	 * You can always reset() it and feed it more data when that happens.
	 */
	next(): Token | undefined;
	/**
	 * Empty the internal buffer of the lexer, and set the line, column, and offset counts back to their initial value.
	 */
	reset(chunk?: string, state?: LexerState): void;
	/**
	 * Returns current state, which you can later pass it as the second argument
	 * to reset() to explicitly control the internal state of the lexer.
	 */
	save(): LexerState;

	tokenLibrary(): { [tokenType: string]: TokenDefinition };

	[Symbol.iterator](): Iterator<Token>;
}

export interface Token {
	/**
	 * Returns value of the token, or its type if value isn't available.
	 */
	toString(): string;
	/**
	 * The name of the group, as passed to compile.
	 */
	type?: string;
	/**
	 * The match contents.
	 */
	value: string;
	/**
	 * The number of bytes from the start of the buffer where the match starts.
	 */
	offset: number;
	/**
	 * The complete match.
	 */
	text: string;
	/**
	 * The number of line breaks found in the match. (Always zero if this rule has lineBreaks: false.)
	 */
	lineBreaks: number;
	/**
	 * The line number of the beginning of the match, starting from 1.
	 */
	line: number;
	/**
	 * The column where the match begins, starting from 1.
	 */
	col: number;

	// categories
	categories: Category[] | null,
}

export interface LexerState {
	line: number;
	col: number;
	state: string;
}