import React from 'react';

export class TemplateString {
    _segments: string[];
    _keyToSegmentIndex: any;
    _keys: any;

    constructor(s: string) {
        const re = /\{\{(.+?)\}\}/g
		let matches = [];
		let m;
		do {
			m = re.exec(s);
			if (m)
			{
				matches.push(m);
			}
		} while (m)

        let segments: string[] = [];
        let keyToSegmentIndex: any = {};
        let keys: string[] = [];
		if (matches.length != 0)
		{
			segments.push(s.slice(0, matches[0].index));
			for (let i = 0; i < matches.length - 1; i++)
			{
				m = matches[i];
                segments.push("");
                keyToSegmentIndex[m[1]] = segments.length - 1;
                keys.push(m[1]);
				let left = m.index + m[0].length;
				let right = matches[i+1].index;
				segments.push(s.slice(left, right));
			}
			m = matches[matches.length - 1];
			segments.push("");
            keyToSegmentIndex[m[1]] = segments.length - 1;
            keys.push(m[1]);
			let left = m.index + m[0].length;
			let right = s.length;
			segments.push(s.slice(left, right));
		}
        else
        {
            segments.push(s);
        }

        this._segments = segments;
        this._keyToSegmentIndex = keyToSegmentIndex;
        this._keys = keys;
    }

    get keys() {
        return this._keys;
    }

    #fillTemplate(format: any) {
        let segments = this._segments.slice(0);

        for (let key of Object.keys(format))
        {
            if (!(key in this._keys)) 
            segments[this._keyToSegmentIndex[key]] = format[key];
        }

        let filledString = segments.join("");

        return filledString;
    }

    format(format: any) {
        // Check all keys are filled
        let counter = 0;
        for (let key of Object.keys(format))
        {
            if (this._keys.find((x: string) => x === key))
            {
                counter++;
            }
        }
        if (counter != this._keys.length)
        {
            throw "Not all template keys are filled";
        }

        let filledString = this.#fillTemplate(format);

        return filledString;
    }
}
