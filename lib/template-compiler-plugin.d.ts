import type Plugin from "broccoli-plugin";
import type { ASTPluginBuilder } from "@glimmer/syntax";
import type { InputNode } from "broccoli-node-api";
type PluginOptions = ConstructorParameters<typeof Plugin>[1]; // this should be exported by the main import.
declare namespace TemplateCompiler {
  interface HtmlBarsOptions extends PluginOptions {
    plugins?: {
      ast?: Array<ASTPluginBuilder>
    };
  }
}
declare class TemplateCompiler extends Plugin {
  public extensions: Array<string>;
  public targetExtension: string;
  constructor(inputTree: InputNode, options: TemplateCompiler.HtmlBarsOptions);
}
export = TemplateCompiler;