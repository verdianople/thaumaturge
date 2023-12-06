import {Plugin} from 'obsidian';

export default class Thaumaturge extends Plugin {

	async onload() {

		// this.registerEditorExtension(tagPlugin());
		this.registerMarkdownPostProcessor((element, context) => {
			const elements = element.findAll('p,li');
			for (const innerElement of elements) {
				innerElement.innerHTML = innerElement.innerText.replace(/{([\w ]*):{2}([\w\d ]*)(?::{2}([\w\d ]*))?}/g, function(full: string, a:string , b:string|number, c:string|number) {
					const segments = [a, b, c].filter(s => s);
					let display = segments.join(' ');
					if (a.toLowerCase() === 'dc' && c) {
						// DC Rolls have special handling.
						const type = (b as string).toLowerCase();
						const typeMap: {[index: string]: string} = {
							str: 'Strength',
							dex: 'Dexterity',
							con: 'Constitution',
							int: 'Intelligence',
							wis: 'Wisdom',
							cha: 'Charisma',
						};
						const resolvedType = (typeMap[type] ?? type);
						const normalizedType = resolvedType.charAt(0).toUpperCase() + resolvedType.slice(1);
						display = `${normalizedType} ${c}`;
					}
					return `<span class="thaumaturge__tag">${display}</span>`
				})
			}
		});
	}

	onunload() {

	}
}
