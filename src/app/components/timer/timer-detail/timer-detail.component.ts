import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  Input,
  AfterViewInit,
  EventEmitter,
  Output,
  OnDestroy,
} from '@angular/core';
import { CdTimerComponent, TimeInterface } from 'angular-cd-timer';
import { Subscription } from 'rxjs';
import { ITimerTickMessage } from 'src/app/models/timer.model';
import { TimerService } from 'src/app/services/timer/timer.service';

@Component({
  selector: 'app-timer-detail',
  templateUrl: './timer-detail.component.html',
  styleUrls: ['./timer-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TimerDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('timer', { static: true })
  timer!: CdTimerComponent;
  @Input() startShown: boolean = true;
  @Input() startTimeVal: number = 3 * 60;
  @Input() endTimeVal: number = 0;
  @Input() speakerName?: string;
  // https://dev.to/this-is-angular/component-communication-parent-to-child-child-to-parent-5800
  @Output() timerDetailEventEmitter = new EventEmitter<any>();
  autoStartVal = this.shouldAutoStart();
  @Input() isHumanSpeaker: boolean = true;
  // State management
  canStart: boolean = true;
  canStop: boolean = false;
  canResume: boolean = false;
  canReset: boolean = false;

  timerResetObservable: Subscription;
  constructor(private _timerService: TimerService) {
    this.timerResetObservable = this._timerService
      .timerObservable()
      .subscribe((timer) => {
        if (this.speakerName == timer.name) {
          this.updateTimerSeconds(timer.startTime);
        }
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.timerResetObservable.unsubscribe();
  }

  ngAfterViewInit(): void {
    // Ensures timer initializes showing the time without continueing the timer
    if (this.shouldAutoStart()) {
      this.stop();
      this.reset();
    }
  }

  // Events
  sendMessage(message: any) {
    this.timerDetailEventEmitter.emit(message);
  }
  OnStart(component: CdTimerComponent) {}
  OnTick(timeInterface: TimeInterface) {
    if (this.isHumanSpeaker) {
      for (
        let index = 0;
        index < this._timerService.flowcycles.length;
        index++
      ) {
        const element = this._timerService.flowcycles[index];
        if (
          element.name == this.speakerName &&
          element.cycleNumber == this._timerService.currentFlowCycle
        ) {
          this._timerService.flowcycles[index].timeSeconds += 1;
        }
      }
    } else {
      let messageState = {
        seconds: this.timer.get().tick_count,
        messageType: 'TimerTickMessage',
      } as ITimerTickMessage;
      this.sendMessage(messageState);
    }
  }
  OnStop(component: CdTimerComponent) {}
  OnComplete(component: CdTimerComponent) {}

  // Methods
  start(): void {
    this.timer.start();
    this.canStart = false;
    this.canStop = true;
    this.canReset = true;
    this.canResume = false;
  }

  stop(): void {
    this.timer.stop();
    this.canResume = true;
    this.canStop = false;
  }

  resume(): void {
    this.timer.resume();
    this.canStart = false;
    this.canStop = true;
    this.canReset = true;
    this.canResume = false;
  }

  reset(): void {
    this.timer.reset();
    this.canStart = true;
    this.canStop = false;
    this.canResume = false;
    this.canReset = false;
  }

  private shouldAutoStart(): boolean {
    if (this.startShown) {
      return true;
    }
    return false;
  }

  public updateTimerSeconds(startSeconds: number) {
    this.timer.startTime = startSeconds;
    this.reset();
  }

  deletePerson(speakerName: any) {
    this._timerService.deletePerson(speakerName);
  }
}
