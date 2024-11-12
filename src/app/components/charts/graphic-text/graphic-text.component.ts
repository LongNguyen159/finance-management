import { CommonModule } from '@angular/common';
import { Component, effect, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { ColorService } from '../../../services/color.service';

@Component({
  selector: 'app-graphic-text',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './graphic-text.component.html',
  styleUrl: './graphic-text.component.scss'
})
export class GraphicTextComponent implements OnInit, OnChanges {
  @Input() text: string = 'Easy Sankey'
  @Input() fontSize: number = 60
  colorService = inject(ColorService)

  option: EChartsOption = {};

  constructor() {
    effect(() => {
      this.updateOption()
    })
  }
  

  ngOnInit(): void {
    this.option = {
      graphic: {
        elements: [
          {
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
              text: this.text,
              fontSize: this.fontSize,
              fontWeight: 'bold',
              lineDash: [0, 200],
              lineDashOffset: 0,
              fill: 'transparent',
              stroke: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
              lineWidth: 1
            },
            keyframeAnimation: {
              duration: 2500,
              loop: false,
              keyframes: [
                {
                  percent: 0.7,
                  style: {
                    fill: 'transparent',
                    lineDashOffset: 200,
                    lineDash: [200, 0]
                  }
                },
                {
                  // Stop for a while.
                  percent: 0.8,
                  style: {
                    fill: 'transparent'
                  }
                },
                {
                  percent: 1,
                  style: {
                    fill: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary
                  }
                }
              ]
            }
          }
        ]
      }
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text'] || changes['fontSize']) {
      this.updateOption();
    }
  }

  updateOption() {
    this.option = {
      graphic: {
        elements: [
          {
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
              text: this.text,
              fontSize: this.fontSize,
              fontWeight: 'bold',
              lineDash: [0, 200],
              lineDashOffset: 0,
              fill: 'transparent',
              stroke: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
              lineWidth: 1
            },
            keyframeAnimation: {
              duration: 2500,
              loop: false,
              keyframes: [
                {
                  percent: 0.7,
                  style: {
                    fill: 'transparent',
                    lineDashOffset: 200,
                    lineDash: [200, 0]
                  }
                },
                {
                  // Stop for a while.
                  percent: 0.8,
                  style: {
                    fill: 'transparent'
                  }
                },
                {
                  percent: 1,
                  style: {
                    fill: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary
                  }
                }
              ]
            }
          }
        ]
      }
    };
  }
}
