import * as soundworks from 'soundworks/client';
import PlayerRenderer from './PlayerRenderer';

const audioContext = soundworks.audioContext;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class PlayerExperience extends soundworks.Experience {

  constructor(assetsDomain, standalone, audioFiles) {
    // disable socket connection - use for standalone application
    super(!standalone);
    this.standalone = standalone;

    if (!standalone) {
      this.checkin = this.require('checkin', { showDialog: false });
    }
    this.platform = this.require('platform', { features: ['web-audio'] });
    this.loader = this.require('loader', {
      assetsDomain: assetsDomain,
      files: audioFiles,
    });
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: `Let's go!` };
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    // play the first loaded buffer immediately
    const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[0];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);

    if (!this.standalone) {
      // play the second loaded buffer when the message `play` is received from
      // the server, the message is send when another player joins the experience.
      this.receive('play', () => {
        const delay = Math.random();
        const src = audioContext.createBufferSource();
        src.buffer = this.loader.buffers[1];
        src.connect(audioContext.destination);
        src.start(audioContext.currentTime + delay);
      });
    }

    // initialize rendering
    this.renderer = new PlayerRenderer(100, 100);
    this.view.addRenderer(this.renderer);

    // this function is called before each update (`Renderer.render`) of the canvas
    this.view.setPreRender(function(ctx, dt) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#000000';
      ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fill();
      ctx.restore();
    });
  }
}
