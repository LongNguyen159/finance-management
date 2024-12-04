import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { ColorService } from '../../../services/color.service';
import { AbnormalityConfig, AbnormalityType } from '../../models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-insights-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, MatDividerModule, MatIconModule],
  templateUrl: './insights-dialog.component.html',
  styleUrl: './insights-dialog.component.scss'
})
export class InsightsDialogComponent {
  colorService = inject(ColorService)

  patternsData = [
    {
      type: AbnormalityType.Growth,
      description: "Growth in spending suggests a gradual increase in expenses over time. It could be due to lifestyle changes, rising costs, or new recurring expenses. It's worth examining if this growth aligns with your income and savings targets.",
      icon: AbnormalityConfig[AbnormalityType.Growth].icon,
      colorLight: AbnormalityConfig[AbnormalityType.Growth].colorLight,
      colorDark: AbnormalityConfig[AbnormalityType.Growth].colorDark
    },
    {
      type: AbnormalityType.FluctuatingGrowth,
      description: "Fluctuating growth often points to unstable spending habits or irregularities, such as occasional splurges or seasonal expenses. Monitoring these fluctuations can help improve financial consistency.",
      icon: AbnormalityConfig[AbnormalityType.FluctuatingGrowth].icon,
      colorLight: AbnormalityConfig[AbnormalityType.FluctuatingGrowth].colorLight,
      colorDark: AbnormalityConfig[AbnormalityType.FluctuatingGrowth].colorDark
    },
    {
      type: AbnormalityType.Spike,
      description: "Spikes typically signal one-time large purchases or unexpected expenses. If frequent, they may strain your budget. Identifying and planning for such spikes can mitigate their impact on long-term finances.",
      icon: AbnormalityConfig[AbnormalityType.Spike].icon,
      colorLight: AbnormalityConfig[AbnormalityType.Spike].colorLight,
      colorDark: AbnormalityConfig[AbnormalityType.Spike].colorDark
    },
    {
      type: AbnormalityType.HighFluctuation,
      description: "High fluctuations suggest irregular spending, which makes financial planning harder. Addressing these variations can improve stability and prevent unexpected shortfalls.",
      icon: AbnormalityConfig[AbnormalityType.HighFluctuation].icon,
      colorLight: AbnormalityConfig[AbnormalityType.HighFluctuation].colorLight,
      colorDark: AbnormalityConfig[AbnormalityType.HighFluctuation].colorDark
    },
    {
      type: AbnormalityType.ExtremeFluctuation,
      description: "Extreme fluctuations often signal financial instability or lack of oversight. Building a budget and adhering to it can reduce unpredictability and foster better savings habits.",
      icon: AbnormalityConfig[AbnormalityType.ExtremeFluctuation].icon,
      colorLight: AbnormalityConfig[AbnormalityType.ExtremeFluctuation].colorLight,
      colorDark: AbnormalityConfig[AbnormalityType.ExtremeFluctuation].colorDark
    }
  ];
}
