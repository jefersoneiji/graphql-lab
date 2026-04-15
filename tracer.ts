import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { diag, DiagConsoleLogger, DiagLogLevel, trace } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'

const elastic_exporter = new OTLPTraceExporter({
    url: 'https://my-apm-server:8200/v1/traces',
    headers: {
        Authorization: 'Bearer TOKEN_HERE'
    }
})

const provider = new NodeTracerProvider({
    spanProcessors: [
        new BatchSpanProcessor(elastic_exporter),
        new SimpleSpanProcessor(new ConsoleSpanExporter())
    ]
})

provider.register()

registerInstrumentations({
    instrumentations: [new HttpInstrumentation({})]
})

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

export const tracer = trace.getTracer('graphql')