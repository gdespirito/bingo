import kilden from 'kilden'
import type { Properties } from 'kilden'

/**
 * Punto único para los eventos personalizados de Bingoo.
 * Envuelve `kilden.track` para que un fallo de analítica nunca rompa la app
 * y para tener los nombres de evento centralizados en un solo lugar.
 */
export function track(event: string, properties?: Properties) {
  try {
    kilden.track(event, properties)
  } catch {
    /* la analítica no debe interrumpir la experiencia de juego */
  }
}
