ActiveAdmin.register Doodle::History do
  actions :show
  menu false

  show do |history|
    panel 'Messages' do
      table_for history.messages do
        column :parts
        column :sender
        column :sent_at
      end
    end
  end
end
