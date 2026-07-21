export interface XmlAttribute {
  name: string;
  value: string | number | boolean | undefined;
}

export function vec3ToAttrs(value: Vec3, omitZero: boolean = true) {
  const { x, y, z } = value;
  return [
    { name: 'x', value: omitZero && x === 0 ? undefined : x },
    { name: 'y', value: omitZero && y === 0 ? undefined : y },
    { name: 'z', value: omitZero && z === 0 ? undefined : z },
  ];
}

export class XmlWriter {
  private readonly lines: string[] = [];
  private indentString = '  ';
  private readonly elementStack: string[] = [];

  constructor(
    private readonly pretty = true,
    private readonly xmlDeclaration = true,
  ) {
    if (xmlDeclaration) {
      this.lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    }
  }

  begin(name: string, attributes?: DeepReadonly<XmlAttribute[]>): void {
    this.writeLine(`<${name}${this.formatAttributes(attributes)}>`);
    this.elementStack.push(name);
  }

  end(name: string): void {
    const expected = this.elementStack.pop();

    if (expected === undefined) {
      throw new Error(`Unexpected </${name}>: no element is currently open.`);
    }

    if (expected !== name) {
      throw new Error(
        `Mismatched closing tag: expected </${expected}> but got </${name}>.`,
      );
    }

    this.writeLine(`</${name}>`);
  }

  empty(name: string, attributes?: DeepReadonly<XmlAttribute[]>): void {
    this.writeLine(`<${name}${this.formatAttributes(attributes)}/>`);
  }

  element(name: string, attributes: DeepReadonly<XmlAttribute[]>, children: (writer: XmlWriter) => void) {
    const childrenWriter = new XmlWriter(this.pretty, false);
    children(childrenWriter);
    if (childrenWriter.lines.length === 0) {
      this.empty(name, attributes);
    }
    else {
      this.begin(name, attributes);
      for (const line of childrenWriter.lines) {
        this.writeLine(line);
      }
      this.end(name);
    }
  }

  comment(text: string): void {
    this.writeLine(`<!-- ${text} -->`);
  }

  toString(): string {
    if (this.elementStack.length > 0) {
      throw new Error(
        `Unclosed element(s): ${this.elementStack.join(' -> ')}`,
      );
    }

    return this.lines.concat('').join(this.pretty ? '\n' : '');
  }

  private writeLine(line: string): void {
    if (!this.pretty) {
      this.lines.push(line);
    }
    else {
      this.lines.push(this.indentString.repeat(this.elementStack.length) + line);
    }
  }

  private formatAttributes(attributes?: DeepReadonly<XmlAttribute[]>): string {
    if (!attributes || attributes.length === 0) {
      return '';
    }

    let s = '';
    for (const attr of attributes) {
      if (attr.value === undefined) continue;
      s += ` ${attr.name}="${this.escapeAttribute(attr.value)}"`;
    }
    return s;
  }

  private escapeAttribute(value: string | number | boolean): string {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
}
