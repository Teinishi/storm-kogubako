export interface XmlAttribute {
  name: string;
  value: string | number | boolean | undefined;
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

  comment(text: string): void {
    this.writeLine(`<!-- ${text} -->`);
  }

  toString(): string {
    if (this.elementStack.length > 0) {
      throw new Error(
        `Unclosed element(s): ${this.elementStack.join(' -> ')}`,
      );
    }

    return this.pretty
      ? this.lines.join('\n')
      : this.lines.join('');
  }

  private writeLine(line: string): void {
    if (!this.pretty) return;

    this.lines.push(this.indentString.repeat(this.elementStack.length) + line);
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
