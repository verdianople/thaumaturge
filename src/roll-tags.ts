import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import {range} from 'lodash';

const FIELD_REGEX = /{([\w ]*):{2}([\w\d ]*)(?::{2}([\w\d ]*))?}/g

/**
 * CodeMirror widget that display a checkbox
 */
class ThaumaturgeTagWidget extends WidgetType {
	constructor(readonly segments: Array<string>) {
		super();
	}

	eq(other: ThaumaturgeTagWidget) {
		return other.segments[0] == this.segments[0];
	}

	toDOM() {
		const box = document.createElement('span');
		box.className = 'tag';
		box.style = 'padding: 0 0.5rem; border: 1px solid currentColor; border-radius: 1rem;';
		box.innerText = this.segments.slice(1).join(' ');
		return box;
	}

	ignoreEvent(_event: Event): boolean {
		return true;
	}
}

/**
 * Creates a decorator of given kind.
 * @param index Target index of the decorator
 * @param kind type of checkbox
 * @param from starting position
 * @param replace If the widget should replace the value text or not
 */
function createDecorator(
	index: number,
	from: number,
	segments: Array<string>,
): [Decoration, number, number] | null {

	const deco = Decoration.replace({
		widget: new ThaumaturgeTagWidget(segments),
	});


	const fromIndex = from + index;
	const toIndex = fromIndex + segments[0].length;
	console.log(from, fromIndex,toIndex, index)
	return [deco, fromIndex, toIndex];
}

/**
 * Adds all decorators for particular line to given builder.
 */
function addDecoratorsForLine(
	line: string,
	from: number,
	builder: RangeSetBuilder<Decoration>,
) {
	let scratch;
	const tagIndicies: Array<{index: number, segments: Array<string>}> = [];
	while ((scratch = FIELD_REGEX.exec(line)) !== null) {
		tagIndicies.push({
			index: scratch.index,
			segments: [...scratch],
		});
	}
	console.log(tagIndicies);
	tagIndicies.forEach(({index, segments}) => {
		const decoratorInfo = createDecorator(index, from, segments);
		if (!decoratorInfo) return;

		const [decorator, fromIndex, toIndex] = decoratorInfo;
		builder.add(fromIndex, toIndex, decorator);
	});
}

function getStartOfLineIndex(line: string): number {
	const trimmedLine = line.trim();
	const isBulletPoint = trimmedLine.startsWith("- ");
	const startIndex = isBulletPoint ? 2 : 0;
	return line.indexOf(trimmedLine) + startIndex;
}

/**
 * Returns all CodeMirror checkbox decorators for boolean values.
 */
function getCheckboxDecorators(view: EditorView) {
	const builder = new RangeSetBuilder<Decoration>();
	// We iterate over the visible ranges
	for (const { from, to } of view.visibleRanges) {
		const startLine = view.state.doc.lineAt(from);
		const endLine = view.state.doc.lineAt(to);

		for (const lineNumber of range(startLine.number, endLine.number)) {
			const line = view.state.doc.line(lineNumber);
			addDecoratorsForLine(line.text, line.from, builder);
		}
	}

	return builder.finish();
}

/**
 * The actual CodeMirror plugin definition that is exported and used in Obsidian.
 */
export const tagPlugin = () => {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = getCheckboxDecorators(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged || update.selectionSet)
					this.decorations = getCheckboxDecorators(update.view);
			}
		},
		{
			decorations: (value) => value.decorations,
			eventHandlers: {
				mousedown: (e, view) => {
					const target = e.target as HTMLElement;
					if (
						target &&
						target.nodeName === 'INPUT' &&
						target.classList.contains(TOGGLE_CLASSNAME)
					) {
						return toggleBoolean(view, view.posAtDOM(target), checkboxPosition);
					}
					return false;
				},
			},
		}
	)};
