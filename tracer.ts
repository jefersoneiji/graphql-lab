import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';



const elastic_exporter = new OTLPTraceExporter({
    url: 'http://localhost:8200/v1/traces',
    // headers: {
    //     Authorization: 'Bearer SOME_SECRET_TOKEN_HERE',
    //     'Content-Type': 'application/x-protobuf'
    // }
});

export const provider = new NodeTracerProvider({
    spanProcessors: [
        new BatchSpanProcessor(elastic_exporter),
    ],
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'graphql-lab',
    }),
});
