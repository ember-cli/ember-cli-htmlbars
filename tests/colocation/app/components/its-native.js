import Component from '@ember/component';
import { tracked } from '@glimmer/tracking';

export default class ItsNative extends Component {
  @tracked greeting = 'Hello!';
}
