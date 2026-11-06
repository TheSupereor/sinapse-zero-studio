import {Node, NodeProps, Txt} from '@canvas-commons/2d';
import {PossibleVector2, Vector2} from '@canvas-commons/core';
import {fonts, sizes, Theme, useTheme} from '@synapticon/brand';

export interface PartProps extends NodeProps {
  /** Label above the symbol. E.g. 'R1 330 Ω'. */
  label?: string;
  /** Stroke color. Default: theme ink. */
  color?: string;
  /** Stroke width. Default: 6. */
  strokeWidth?: number;
  /** Label position, local. Default: [0, -64]. */
  labelPosition?: PossibleVector2;
}

/**
 * Base class of the schematic symbols. Every symbol declares named pins, and
 * `pin('a')` returns the pin's position **in the parent's space** (it follows the
 * symbol's position, rotation and scale). So keep wires and symbols under the same parent:
 *
 * ```tsx
 * <Wire points={() => [r().pin('b'), led().pin('a')]} />
 * ```
 */
export abstract class Part extends Node {
  protected readonly theme: Theme;
  protected readonly color: string;
  protected readonly strokeWidth: number;
  protected abstract readonly localPins: Record<string, PossibleVector2>;

  public constructor({label, color, strokeWidth = 6, labelPosition = [0, -64], ...props}: PartProps) {
    super(props);
    this.theme = useTheme();
    this.color = color ?? this.theme.ink;
    this.strokeWidth = strokeWidth;
    if (label) {
      this.add(
        <Txt
          text={label}
          position={labelPosition}
          rotation={() => -this.rotation()}
          fontFamily={fonts.display}
          fontSize={sizes.label}
          fontWeight={600}
          fill={this.theme.muted}
        />,
      );
    }
  }

  /** Position of the pin in the parent's space. */
  public pin(name: string): Vector2 {
    const local = this.localPins[name];
    if (local === undefined) {
      throw new Error(
        `${this.constructor.name} has no pin "${name}". Pins: ${Object.keys(this.localPins).join(', ')}`,
      );
    }
    return new Vector2(local).transformAsPoint(this.localToParent());
  }

  /** Stroke style shared by every symbol. */
  protected strokeStyle() {
    return {
      stroke: this.color,
      lineWidth: this.strokeWidth,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    };
  }
}
