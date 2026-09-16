STACK_NAME   ?= education-hackathon
REGION       ?= us-east-1
BUCKET       ?= education-hackathon-frontend-247826798819
DIST_ID      ?= E3EGKG3A8YBGC2

.PHONY: build deploy update deploy-frontend logs download-lofi

# ── Backend ───────────────────────────────────────────────────────────────

build:
	sam build

deploy: build
	sam deploy --guided --stack-name $(STACK_NAME) --region $(REGION)

update: build
	sam deploy --stack-name $(STACK_NAME) --region $(REGION) --no-confirm-changeset

logs:
	sam logs -n $(FUNCTION) --stack-name $(STACK_NAME) --region $(REGION) --tail

download-lofi:
	bash scripts/download-lofi.sh

# ── Frontend ──────────────────────────────────────────────────────────────

deploy-frontend:
	cd frontend && npm run build
	aws s3 sync frontend/dist/ s3://$(BUCKET)/ --delete --region $(REGION)
	aws cloudfront create-invalidation --distribution-id $(DIST_ID) --paths "/*"
	@echo "Live at: https://d3h6z54ed7kcqq.cloudfront.net"
